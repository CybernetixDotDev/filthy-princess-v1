"use server";

import { createClient } from "@/utils/supabase/server";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

export type AccessResult =
  | { status: "success" }
  | { status: "check-email"; message: string }
  | { status: "error"; message: string };

export type PasswordResetRequestResult =
  | { status: "success"; message: string }
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

export async function requestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<PasswordResetRequestResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("Password reset request failed.", error.message);
      return {
        status: "error",
        message: "We couldn't send the reset link right now. Please try again.",
      };
    }

    return {
      status: "success",
      message:
        "If an account exists for that email address, a password reset link has been sent.",
    };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}
