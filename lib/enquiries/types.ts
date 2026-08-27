export const RETREAT_TYPES = [
  "Solo",
  "Couples",
  "Private Group",
  "I am not sure yet",
] as const;

export type RetreatType = (typeof RETREAT_TYPES)[number];

export type EnquiryDraft = {
  submissionKey: string;
  name: string;
  retreatType: RetreatType;
  guestCount: string;
  travellingFrom: string;
  preferredTiming: string;
  broughtHere: string;
  hopingToDiscover: string;
};

export type EnquiryPayload = Omit<EnquiryDraft, "submissionKey"> & {
  submissionKey?: string;
};

export function createSubmissionKey() {
  return crypto.randomUUID();
}

export function normalizeEnquiryPayload(payload: EnquiryPayload): EnquiryDraft {
  return {
    submissionKey: payload.submissionKey || createSubmissionKey(),
    name: payload.name.trim(),
    retreatType: payload.retreatType,
    guestCount: payload.guestCount.trim(),
    travellingFrom: payload.travellingFrom.trim(),
    preferredTiming: payload.preferredTiming.trim(),
    broughtHere: payload.broughtHere.trim(),
    hopingToDiscover: payload.hopingToDiscover.trim(),
  };
}

export function validateEnquiryDraft(draft: EnquiryDraft) {
  const errors: Partial<Record<keyof EnquiryDraft, string>> = {};

  if (!draft.submissionKey) {
    errors.submissionKey = "Missing submission key.";
  }

  if (!draft.name) {
    errors.name = "Please share your name.";
  }

  if (!RETREAT_TYPES.includes(draft.retreatType)) {
    errors.retreatType = "Please choose a retreat type.";
  }

  if (draft.guestCount) {
    const guestCount = Number(draft.guestCount);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      errors.guestCount = "Guest count must be a positive number.";
    }
  }

  if (!draft.broughtHere) {
    errors.broughtHere = "Please tell Cally what brought you here.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
