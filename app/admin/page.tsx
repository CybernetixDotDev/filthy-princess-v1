import { redirect } from "next/navigation";

import AdminDashboard, { AdminEnquiry } from "@/components/admin/AdminDashboard";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  sender_role: "admin" | "user";
  body: string;
  created_at: string;
};

type TransactionRow = {
  id: string;
  user_id: string;
  upgrade_request_id: string;
  status: string;
  usd_amount: number;
  expected_eth_amount: string;
  receiving_wallet_address: string;
  invited_by: string;
  user_reported_paid_at: string | null;
  user_supplied_transaction_hash: string | null;
  transaction_hash: string | null;
  transaction_receipt: string | null;
  admin_payment_notes: string | null;
  payment_confirmed_at: string | null;
  payment_confirmed_by: string | null;
  access_granted_at: string | null;
  access_granted_by: string | null;
  created_at: string;
  updated_at: string;
};

function firstByUserId<T extends { user_id: string }>(rows: T[]) {
  return rows.reduce<Record<string, T>>((current, row) => {
    if (!current[row.user_id]) {
      current[row.user_id] = row;
    }

    return current;
  }, {});
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/access");
  }

  const { data: adminEntitlement } = await supabase
    .from("user_entitlements")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminEntitlement?.is_admin) {
    redirect("/portal");
  }

  const { data: enquiryRows } = await supabase
    .from("retreat_enquiries")
    .select(
      "id, user_id, submitted_at, status, name, retreat_type, guest_count, travelling_from, preferred_timing, brought_here, hoping_to_discover",
    )
    .order("submitted_at", { ascending: false })
    .limit(60);

  const enquiries = enquiryRows ?? [];
  const userIds = Array.from(new Set(enquiries.map((enquiry) => enquiry.user_id)));
  const enquiryIds = enquiries.map((enquiry) => enquiry.id);

  const [
    { data: profileRows },
    { data: entitlementRows },
    { data: conversationRows },
    { data: membershipOfferRows },
    { data: innerSanctumRows },
  ] = await Promise.all([
    userIds.length
      ? supabase
          .from("profiles")
          .select("id, email, display_name")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase
          .from("user_entitlements")
          .select(
            "user_id, is_user, is_admin, membership_accepted, inner_sanctum_access",
          )
          .in("user_id", userIds)
      : Promise.resolve({ data: [] }),
    enquiryIds.length
      ? supabase
          .from("conversations")
          .select("id, user_id, enquiry_id, created_at, updated_at")
          .in("enquiry_id", enquiryIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase
          .from("membership_offers")
          .select("id, user_id, status, created_at, responded_at")
          .in("user_id", userIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase
          .from("inner_sanctum_requests")
          .select("id, user_id, status, created_at, updated_at")
          .in("user_id", userIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const conversations = conversationRows ?? [];
  const innerSanctumRequests = innerSanctumRows ?? [];
  const conversationIds = conversations.map((conversation) => conversation.id);
  const innerSanctumRequestIds = innerSanctumRequests.map((request) => request.id);
  const [{ data: messageRows }, { data: transactionRows }] = await Promise.all([
    conversationIds.length
      ? supabase
          .from("conversation_messages")
          .select("id, conversation_id, sender_user_id, sender_role, body, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    innerSanctumRequestIds.length
      ? supabase
          .from("inner_sanctum_transactions")
          .select(
            "id, user_id, upgrade_request_id, status, usd_amount, expected_eth_amount, receiving_wallet_address, invited_by, user_reported_paid_at, user_supplied_transaction_hash, transaction_hash, transaction_receipt, admin_payment_notes, payment_confirmed_at, payment_confirmed_by, access_granted_at, access_granted_by, created_at, updated_at",
          )
          .in("upgrade_request_id", innerSanctumRequestIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const profilesById = (profileRows ?? []).reduce<
    Record<string, { email: string | null; display_name: string | null }>
  >((current, profile) => {
    current[profile.id] = {
      email: profile.email,
      display_name: profile.display_name,
    };

    return current;
  }, {});

  const entitlementsById = (entitlementRows ?? []).reduce<
    Record<
      string,
      {
        is_user: boolean;
        is_admin: boolean;
        membership_accepted: boolean;
        inner_sanctum_access: boolean;
      }
    >
  >((current, entitlement) => {
    current[entitlement.user_id] = entitlement;

    return current;
  }, {});

  const conversationsByEnquiryId = conversations.reduce<
    Record<string, (typeof conversations)[number]>
  >((current, conversation) => {
    current[conversation.enquiry_id] = conversation;

    return current;
  }, {});

  const messagesByConversationId = ((messageRows ?? []) as MessageRow[]).reduce<
    Record<string, MessageRow[]>
  >((current, message) => {
    current[message.conversation_id] ??= [];
    current[message.conversation_id].push(message);

    return current;
  }, {});

  const latestOffersByUserId = firstByUserId(membershipOfferRows ?? []);
  const latestInnerRequestsByUserId = firstByUserId(innerSanctumRequests);
  const transactionsByRequestId = ((transactionRows ?? []) as TransactionRow[]).reduce<
    Record<string, TransactionRow[]>
  >((current, transaction) => {
    current[transaction.upgrade_request_id] ??= [];
    current[transaction.upgrade_request_id].push(transaction);

    return current;
  }, {});

  const adminEnquiries: AdminEnquiry[] = enquiries.map((enquiry) => {
    const conversation = conversationsByEnquiryId[enquiry.id] ?? null;
    const messages = conversation ? messagesByConversationId[conversation.id] ?? [] : [];

    return {
      ...enquiry,
      profile: profilesById[enquiry.user_id] ?? null,
      entitlement: entitlementsById[enquiry.user_id] ?? null,
      conversation,
      messages,
      membershipOffer: latestOffersByUserId[enquiry.user_id] ?? null,
      innerSanctumRequest: latestInnerRequestsByUserId[enquiry.user_id] ?? null,
      innerSanctumTransactions:
        transactionsByRequestId[latestInnerRequestsByUserId[enquiry.user_id]?.id ?? ""] ??
        [],
    };
  });

  return (
    <AdminDashboard
      enquiries={adminEnquiries}
      receivingWalletAddress={process.env.INNER_SANCTUM_ETH_WALLET_ADDRESS ?? ""}
    />
  );
}
