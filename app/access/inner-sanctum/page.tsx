import { redirect } from "next/navigation";

import InnerSanctumInterest from "@/components/portal/InnerSanctumInterest";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function InnerSanctumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/access?message=private-access-needed");
  }

  const { data: request } = await supabase
    .from("inner_sanctum_requests")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="inner-page section-shell">
      <section className="inner-panel" aria-labelledby="inner-title">
        <p className="section-kicker">Inner Sanctum</p>
        <h1 id="inner-title">Inner Sanctum</h1>
        <p>
          The Inner Sanctum opens a deeper layer of the Filthy Princess
          experience.
        </p>
        <p>
          You can continue enjoying Basic Membership whether or not you choose
          to explore this path.
        </p>
        <p>
          Inner Sanctum access is currently offered through a manual application
          and payment process.
        </p>

        <div className="inner-detail">
          <h2>Access</h2>
          <p>Current access contribution:</p>
          <strong>USD $500 equivalent in Ethereum</strong>
          <p>
            Payment is currently handled manually through wallet-to-wallet
            transfer.
          </p>
          <p>
            Once payment has been independently confirmed, Inner Sanctum access
            will be activated manually by an administrator.
          </p>
        </div>

        <div className="inner-detail">
          <h2>Important</h2>
          <p>
            Exploring this option does not remove or restrict Basic Membership.
          </p>
          <p>You can return to your normal portal at any time.</p>
        </div>

        <InnerSanctumInterest currentStatus={request?.status ?? null} />
      </section>
    </main>
  );
}
