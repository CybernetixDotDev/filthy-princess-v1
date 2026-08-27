"use server";

import { createClient } from "@/utils/supabase/server";
import { EnquiryDraft, validateEnquiryDraft } from "@/lib/enquiries/types";
import { getSupabaseErrorMessage } from "@/lib/supabase/errors";

export type SubmitEnquiryResult =
  | { status: "success" }
  | { status: "unauthenticated" }
  | {
      status: "validation-error";
      message: string;
      fieldErrors: Partial<Record<keyof EnquiryDraft, string>>;
    }
  | { status: "error"; message: string };

export async function submitRetreatEnquiry(
  draft: EnquiryDraft,
): Promise<SubmitEnquiryResult> {
  const validation = validateEnquiryDraft(draft);

  if (!validation.valid) {
    return {
      status: "validation-error",
      message: "Please check the enquiry details and try again.",
      fieldErrors: validation.errors,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { status: "unauthenticated" };
    }

    const { data: existingEnquiry, error: existingError } = await supabase
      .from("retreat_enquiries")
      .select("id")
      .eq("user_id", user.id)
      .eq("submission_key", draft.submissionKey)
      .maybeSingle();

    if (existingError) {
      return {
        status: "error",
        message: "I could not check this enquiry. Please try again.",
      };
    }

    if (existingEnquiry) {
      return { status: "success" };
    }

    const guestCount = draft.guestCount ? Number(draft.guestCount) : null;

    const { error: insertError } = await supabase
      .from("retreat_enquiries")
      .insert({
        user_id: user.id,
        submission_key: draft.submissionKey,
        status: "submitted",
        admin_notes: null,
        name: draft.name,
        retreat_type: draft.retreatType,
        guest_count: guestCount,
        travelling_from: draft.travellingFrom || null,
        preferred_timing: draft.preferredTiming || null,
        brought_here: draft.broughtHere,
        hoping_to_discover: draft.hopingToDiscover || null,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return { status: "success" };
      }

      return {
        status: "error",
        message: "Your enquiry could not be saved yet. Please try again.",
      };
    }

    return { status: "success" };
  } catch (error) {
    return { status: "error", message: getSupabaseErrorMessage(error) };
  }
}
