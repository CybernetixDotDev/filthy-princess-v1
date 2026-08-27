import {
  EnquiryDraft,
  EnquiryPayload,
  normalizeEnquiryPayload,
  validateEnquiryDraft,
} from "./types";

export const PENDING_ENQUIRY_KEY = "filthyprincess_pending_enquiry";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function savePendingEnquiry(payload: EnquiryPayload) {
  if (!canUseStorage()) {
    return null;
  }

  const draft = normalizeEnquiryPayload(payload);
  window.localStorage.setItem(PENDING_ENQUIRY_KEY, JSON.stringify(draft));
  return draft;
}

export function getPendingEnquiry(): EnquiryDraft | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawDraft = window.localStorage.getItem(PENDING_ENQUIRY_KEY);

  if (!rawDraft) {
    return null;
  }

  try {
    const draft = JSON.parse(rawDraft) as EnquiryDraft;
    const validation = validateEnquiryDraft(draft);

    return validation.valid ? draft : null;
  } catch {
    return null;
  }
}

export function clearPendingEnquiry() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(PENDING_ENQUIRY_KEY);
}
