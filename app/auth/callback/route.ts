import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

const OAUTH_NEXT_COOKIE = "filthyprincess_oauth_next";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/portal";
  }

  return value;
}

function decodeCookieValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const cookieNext = decodeCookieValue(request.cookies.get(OAUTH_NEXT_COOKIE)?.value);
  const next = getSafeNextPath(cookieNext ?? requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const response = NextResponse.redirect(new URL(next, requestUrl.origin));
      response.cookies.delete(OAUTH_NEXT_COOKIE);
      return response;
    }

    console.error("OAuth code exchange failed.", error.message);
  }

  const response = NextResponse.redirect(
    new URL("/access?message=oauth-failed", requestUrl.origin),
  );
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}
