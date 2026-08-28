"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

type ActionResult =
  | { status: "success"; message?: string }
  | { status: "error"; message: string }
  | { status: "unauthorized"; message: string };

const ETH_TRANSACTION_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

async function requireAdmin() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return { supabase, user: null, isAdmin: false };
  }

  const { data } = await supabase
    .from("user_entitlements")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, isAdmin: Boolean(data?.is_admin) };
}

function getReceivingWalletAddress() {
  return process.env.INNER_SANCTUM_ETH_WALLET_ADDRESS?.trim() ?? "";
}

function normalizeOptionalHash(hash: string) {
  const normalizedHash = hash.trim();

  if (!normalizedHash) {
    return "";
  }

  if (!ETH_TRANSACTION_HASH_PATTERN.test(normalizedHash)) {
    return "";
  }

  return normalizedHash;
}

function normalizeEthAmount(amount: string) {
  const normalizedAmount = amount.trim();

  if (!/^\d+(\.\d{1,18})?$/.test(normalizedAmount)) {
    return "";
  }

  if (Number(normalizedAmount) <= 0) {
    return "";
  }

  return normalizedAmount;
}

export async function sendAdminMessage(
  enquiryId: string,
  body: string,
): Promise<ActionResult> {
  const note = body.trim();

  if (!note) {
    return { status: "error", message: "Please write a note first." };
  }

  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return {
        status: "unauthorized",
        message: "Only an administrator can send this note.",
      };
    }

    const { data: enquiry, error: enquiryError } = await supabase
      .from("retreat_enquiries")
      .select("id, user_id")
      .eq("id", enquiryId)
      .maybeSingle();

    if (enquiryError || !enquiry) {
      return { status: "error", message: "That enquiry could not be found." };
    }

    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("enquiry_id", enquiry.id)
      .maybeSingle();

    let conversationId = existingConversation?.id;

    if (!conversationId) {
      const { data: createdConversation, error: conversationError } =
        await supabase
          .from("conversations")
          .insert({
            user_id: enquiry.user_id,
            enquiry_id: enquiry.id,
          })
          .select("id")
          .single();

      if (conversationError || !createdConversation) {
        return {
          status: "error",
          message: "The conversation could not be opened yet.",
        };
      }

      conversationId = createdConversation.id;
    }

    const { error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationId,
        sender_user_id: user.id,
        sender_role: "admin",
        body: note,
      });

    if (messageError) {
      return { status: "error", message: "The note could not be sent yet." };
    }

    await supabase
      .from("retreat_enquiries")
      .update({ status: "awaiting_information" })
      .eq("id", enquiry.id);

    revalidatePath("/admin");
    revalidatePath("/portal");

    return { status: "success", message: "Note sent." };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function sendUserMessage(
  conversationId: string,
  body: string,
): Promise<ActionResult> {
  const note = body.trim();

  if (!note) {
    return { status: "error", message: "Please write a reply first." };
  }

  try {
    const { supabase, user } = await getCurrentUser();

    if (!user) {
      return {
        status: "unauthorized",
        message: "Please sign in to reply.",
      };
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError || !conversation || conversation.user_id !== user.id) {
      return {
        status: "unauthorized",
        message: "That conversation is not available.",
      };
    }

    const { error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversation.id,
        sender_user_id: user.id,
        sender_role: "user",
        body: note,
      });

    if (messageError) {
      return { status: "error", message: "Your reply could not be sent yet." };
    }

    revalidatePath("/portal");
    revalidatePath("/admin");

    return { status: "success", message: "Reply sent." };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function offerMembership(userId: string): Promise<ActionResult> {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return {
        status: "unauthorized",
        message: "Only an administrator can offer membership.",
      };
    }

    const { data: entitlement } = await supabase
      .from("user_entitlements")
      .select("membership_accepted")
      .eq("user_id", userId)
      .maybeSingle();

    if (entitlement?.membership_accepted) {
      return { status: "success", message: "Membership is already active." };
    }

    const { data: pendingOffer } = await supabase
      .from("membership_offers")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingOffer) {
      return { status: "success", message: "Offer is already pending." };
    }

    const { error } = await supabase.from("membership_offers").insert({
      user_id: userId,
      offered_by: user.id,
      status: "pending",
    });

    if (error) {
      return { status: "error", message: "The offer could not be created." };
    }

    revalidatePath("/admin");
    revalidatePath("/portal");

    return { status: "success", message: "Membership offered." };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function acceptMembershipOffer(): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser();

    if (!user) {
      return {
        status: "unauthorized",
        message: "Please sign in to accept membership.",
      };
    }

    const { error } = await supabase.rpc("accept_membership_offer");

    if (error) {
      return {
        status: "error",
        message: "The membership offer could not be accepted yet.",
      };
    }

    revalidatePath("/portal");
    revalidatePath("/admin");

    return { status: "success", message: "Welcome inside." };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function setInnerSanctumAccess(
  userId: string,
  enabled: boolean,
): Promise<ActionResult> {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return {
        status: "unauthorized",
        message: "Only an administrator can change Inner Sanctum access.",
      };
    }

    const update = enabled
      ? {
          is_user: true,
          membership_accepted: true,
          inner_sanctum_access: true,
        }
      : { inner_sanctum_access: false };

    const { error } = await supabase
      .from("user_entitlements")
      .update(update)
      .eq("user_id", userId);

    if (error) {
      return {
        status: "error",
        message: "Inner Sanctum access could not be updated.",
      };
    }

    if (enabled) {
      await supabase
        .from("inner_sanctum_requests")
        .update({ status: "approved" })
        .eq("user_id", userId)
        .eq("status", "interested");
    }

    revalidatePath("/admin");
    revalidatePath("/portal");

    return {
      status: "success",
      message: enabled
        ? "Inner Sanctum access granted."
        : "Inner Sanctum access removed.",
    };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function beginInnerSanctumUpgrade(
  requestId: string,
  expectedEthAmount: string,
): Promise<ActionResult> {
  const walletAddress = getReceivingWalletAddress();
  const normalizedAmount = normalizeEthAmount(expectedEthAmount);

  if (!walletAddress) {
    return {
      status: "error",
      message:
        "Set INNER_SANCTUM_ETH_WALLET_ADDRESS before sending a payment invitation.",
    };
  }

  if (!normalizedAmount) {
    return {
      status: "error",
      message: "Enter the required ETH amount using up to 18 decimals.",
    };
  }

  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return {
        status: "unauthorized",
        message: "Only an administrator can begin an upgrade.",
      };
    }

    const { error } = await supabase.rpc("begin_inner_sanctum_upgrade", {
      p_request_id: requestId,
      p_expected_eth_amount: normalizedAmount,
      p_receiving_wallet_address: walletAddress,
    });

    if (error) {
      return {
        status: "error",
        message: "The payment invitation could not be sent yet.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/access/inner-sanctum");

    return { status: "success", message: "Payment invitation sent." };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function reportInnerSanctumPayment(
  transactionId: string,
  userSuppliedTransactionHash: string,
): Promise<ActionResult> {
  const normalizedHash = normalizeOptionalHash(userSuppliedTransactionHash);

  if (userSuppliedTransactionHash.trim() && !normalizedHash) {
    return {
      status: "error",
      message: "Use a valid Ethereum transaction hash, or leave it blank.",
    };
  }

  try {
    const { supabase, user } = await getCurrentUser();

    if (!user) {
      return {
        status: "unauthorized",
        message: "Please sign in to report your payment.",
      };
    }

    const { error } = await supabase.rpc("report_inner_sanctum_payment", {
      p_transaction_id: transactionId,
      p_user_supplied_transaction_hash: normalizedHash || null,
    });

    if (error) {
      return {
        status: "error",
        message: "Your payment report could not be recorded yet.",
      };
    }

    revalidatePath("/portal");
    revalidatePath("/access/inner-sanctum");
    revalidatePath("/admin");

    return { status: "success", message: "Payment submitted for review." };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function confirmInnerSanctumPayment(
  transactionId: string,
  transactionHash: string,
  transactionReceipt: string,
  adminPaymentNotes: string,
): Promise<ActionResult> {
  const normalizedHash = normalizeOptionalHash(transactionHash);

  if (transactionHash.trim() && !normalizedHash) {
    return {
      status: "error",
      message: "Use a valid Ethereum transaction hash, or leave it blank.",
    };
  }

  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return {
        status: "unauthorized",
        message: "Only an administrator can confirm payment.",
      };
    }

    const { error } = await supabase.rpc("confirm_inner_sanctum_payment", {
      p_transaction_id: transactionId,
      p_transaction_hash: normalizedHash || null,
      p_transaction_receipt: transactionReceipt.trim() || null,
      p_admin_payment_notes: adminPaymentNotes.trim() || null,
    });

    if (error) {
      return {
        status: "error",
        message: "Payment could not be confirmed yet.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/access/inner-sanctum");

    return { status: "success", message: "Payment confirmed." };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function grantInnerSanctumAccessForPayment(
  userId: string,
  transactionId: string,
): Promise<ActionResult> {
  try {
    const { supabase, user, isAdmin } = await requireAdmin();

    if (!user || !isAdmin) {
      return {
        status: "unauthorized",
        message: "Only an administrator can grant Inner Sanctum access.",
      };
    }

    const { error } = await supabase.rpc("grant_inner_sanctum_access_for_payment", {
      p_user_id: userId,
      p_transaction_id: transactionId,
    });

    if (error) {
      return {
        status: "error",
        message: "Inner Sanctum access could not be granted yet.",
      };
    }

    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/access/inner-sanctum");

    return { status: "success", message: "Inner Sanctum access granted." };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function expressInnerSanctumInterest(): Promise<ActionResult> {
  try {
    const { supabase, user } = await getCurrentUser();

    if (!user) {
      return {
        status: "unauthorized",
        message: "Please sign in to express interest.",
      };
    }

    const { data: existingRequest } = await supabase
      .from("inner_sanctum_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["interested", "awaiting_payment", "payment_review", "approved"])
      .limit(1)
      .maybeSingle();

    if (existingRequest) {
      return {
        status: "success",
        message:
          existingRequest.status === "approved"
            ? "Inner Sanctum access is already active."
            : "Your interest has already been received.",
      };
    }

    const { error } = await supabase.from("inner_sanctum_requests").insert({
      user_id: user.id,
      status: "interested",
    });

    if (error) {
      return {
        status: "error",
        message: "Your interest could not be recorded yet.",
      };
    }

    revalidatePath("/access/inner-sanctum");
    revalidatePath("/admin");

    return {
      status: "success",
      message: "Your interest has been received.",
    };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}
