import { redirect } from "next/navigation";

import AccessForm from "@/components/AccessForm";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccessPage({
  searchParams,
}: PageProps<"/access">) {
  const params = await searchParams;
  const continueTo = params.continue === "enquiry" ? "enquiry" : null;
  const message = typeof params.message === "string" ? params.message : null;
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  } catch (error) {
    console.error("Supabase access check failed.", error);
  }

  if (isAuthenticated && continueTo !== "enquiry") {
    redirect("/portal");
  }

  return (
    <main className="access-page section-shell">
      <AccessForm
        continueTo={continueTo}
        initialMessage={message}
        isAuthenticated={isAuthenticated}
      />
    </main>
  );
}
