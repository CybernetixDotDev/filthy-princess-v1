import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/portal";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    console.error("OAuth code exchange failed.", error.message);
  }

  return NextResponse.redirect(
    new URL("/access?message=oauth-failed", requestUrl.origin),
  );
}
