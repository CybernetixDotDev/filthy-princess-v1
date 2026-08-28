import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import PortalContentGateways from "@/components/PortalContentGateways";
import MemberWorkflowPanel from "@/components/portal/MemberWorkflowPanel";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  submitted: "Enquiry received",
  under_review: "Being personally considered",
  awaiting_information: "We would love to know a little more",
  invited: "Your invitation is waiting",
  declined: "This journey is not opening right now",
  closed: "Journey complete",
};

export default async function PortalPage() {
  const supabase = await createClient();
  let userId: string | null = null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userId = user?.id ?? null;
  } catch (error) {
    console.error("Supabase portal access check failed.", error);
    redirect("/access?message=auth-unavailable");
  }

  if (!userId) {
    redirect("/access");
  }

  const [{ data: profile }, { data: latestEnquiry }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("retreat_enquiries")
      .select("id, status, submitted_at, retreat_type, preferred_timing")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const [
    { data: entitlement },
    { data: membershipOffer },
    { data: conversation },
    { data: innerSanctumRequest },
  ] = await Promise.all([
    supabase
      .from("user_entitlements")
      .select("is_user, is_admin, membership_accepted, inner_sanctum_access")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("membership_offers")
      .select("id, status, created_at, responded_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    latestEnquiry
      ? supabase
          .from("conversations")
          .select("id, updated_at")
          .eq("enquiry_id", latestEnquiry.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("inner_sanctum_requests")
      .select("id, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const [{ data: messages }, { data: innerSanctumTransaction }] = await Promise.all([
    conversation
      ? supabase
          .from("conversation_messages")
          .select("id, sender_role, body, created_at")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    innerSanctumRequest
      ? supabase
          .from("inner_sanctum_transactions")
          .select(
            "id, status, usd_amount, expected_eth_amount, receiving_wallet_address, user_reported_paid_at, user_supplied_transaction_hash, transaction_hash, payment_confirmed_at, access_granted_at, created_at",
          )
          .eq("upgrade_request_id", innerSanctumRequest.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const displayName =
    profile?.display_name || profile?.email || "beautiful stranger";

  return (
    <main className="portal-page section-shell">
      <header className="portal-header">
        <div className="portal-brand">
          <Image
            alt="Filthy Princess"
            className="portal-logo"
            height={140}
            src="/FilthyPrincessLogo.png"
            width={420}
          />
          <div>
            <p className="section-kicker">Private portal</p>
            <h1>Welcome, {displayName}</h1>
          </div>
        </div>
        <form action={signOut}>
          <button className="quiet-button" type="submit">
            Sign out
          </button>
        </form>
      </header>

      {latestEnquiry ? (
        <>
          <MemberWorkflowPanel
            entitlement={entitlement}
            membershipOffer={membershipOffer}
            conversation={conversation}
            messages={messages ?? []}
            innerSanctumRequest={innerSanctumRequest}
            innerSanctumTransaction={innerSanctumTransaction}
          />
          <section className="portal-status portal-enquiry-summary" aria-labelledby="enquiry-summary-title">
            <p className="section-kicker">Retreat enquiry</p>
            <h2 id="enquiry-summary-title">{statusLabels[latestEnquiry.status]}</h2>
            <dl className="portal-details">
              <div>
                <dt>Retreat type</dt>
                <dd>{latestEnquiry.retreat_type}</dd>
              </div>
              <div>
                <dt>Timing</dt>
                <dd>{latestEnquiry.preferred_timing || "Still unfolding"}</dd>
              </div>
            </dl>
          </section>
        </>
      ) : (
        <section className="portal-status" aria-labelledby="ready-title">
          <p className="section-kicker">Private space</p>
          <h2 id="ready-title">Your private space is ready.</h2>
          <p>You have not submitted a retreat enquiry yet.</p>
          <Link className="primary-cta portal-cta" href="/#enquiry">
            Return to the door
          </Link>
        </section>
      )}

      <section className="portal-next" aria-labelledby="next-title">
        <h2 id="next-title">What happens next</h2>
        <div className="portal-next-copy">
          <p>Your enquiry has been received.</p>
          <p>It will be personally considered.</p>
          <p>
            We may reach out with a few questions if we would like to understand
            you better.
          </p>
          <p>
            If the experience feels aligned, the next part of your journey will
            open.
          </p>
          <p>
            <strong>
              Come back soon to see whether your enquiry has been considered.
            </strong>
          </p>
        </div>
      </section>

      <PortalContentGateways retreatType={latestEnquiry?.retreat_type ?? null} />

      {entitlement?.membership_accepted &&
      !entitlement.inner_sanctum_access ? (
        <footer className="portal-footer">
          <Link className="portal-upgrade-link" href="/access/inner-sanctum">
            Upgrade Membership
          </Link>
        </footer>
      ) : null}
    </main>
  );
}
