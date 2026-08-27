"use server";

import { createClient } from "@/utils/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

export type AccessResult =
  | { status: "success" }
  | { status: "check-email"; message: string }
  | { status: "error"; message: string };

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AccessResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    return { status: "success" };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}

export async function createPrivateAccess({
  displayName,
  email,
  password,
  redirectTo,
}: {
  displayName: string;
  email: string;
  password: string;
  redirectTo: string;
}): Promise<AccessResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    if (!data.session) {
      return {
        status: "check-email",
        message:
          "Check your email to continue. Your enquiry is safely preserved.",
      };
    }

    return { status: "success" };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}
