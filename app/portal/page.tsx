import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions/auth";
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

const futureRooms = [
  "The philosophy",
  "Meet Cally",
  "What to expect",
  "Preparing for the experience",
  "Questions & boundaries",
];

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
      .select("status, submitted_at, retreat_type, preferred_timing")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const displayName =
    profile?.display_name || profile?.email || "beautiful stranger";

  return (
    <main className="portal-page section-shell">
      <header className="portal-header">
        <div>
          <p className="section-kicker">Private portal</p>
          <h1>Welcome, {displayName}</h1>
        </div>
        <form action={signOut}>
          <button className="quiet-button" type="submit">
            Sign out
          </button>
        </form>
      </header>

      {latestEnquiry ? (
        <section className="portal-status" aria-labelledby="status-title">
          <p className="section-kicker">Retreat enquiry</p>
          <h2 id="status-title">{statusLabels[latestEnquiry.status]}</h2>
          <p>
            Your enquiry has been safely received. Filthy Princess retreats are
            intentionally intimate and enquiries are considered personally
            rather than processed as automatic bookings.
          </p>
          <p>
            We may reach out with a few questions as the journey develops.
          </p>
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
        <ol>
          <li>Your enquiry is received.</li>
          <li>It will be personally considered.</li>
          <li>We may ask for more information.</li>
          <li>If the experience feels aligned, the next part opens.</li>
        </ol>
      </section>

      <section className="portal-rooms" aria-labelledby="rooms-title">
        <h2 id="rooms-title">While you are here</h2>
        <div className="portal-room-grid">
          {futureRooms.map((room) => (
            <article className="portal-room" key={room}>
              <h3>{room}</h3>
              <p>Coming later in the private pre-retreat journey.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
