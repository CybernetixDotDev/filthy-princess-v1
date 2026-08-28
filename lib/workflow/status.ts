export type EntitlementState = {
  is_user: boolean;
  is_admin: boolean;
  membership_accepted: boolean;
  inner_sanctum_access: boolean;
} | null;

export type MembershipOfferState = {
  id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
} | null;

export function getJourneyState({
  entitlement,
  hasAdminResponse,
  pendingMembershipOffer,
}: {
  entitlement: EntitlementState;
  hasAdminResponse: boolean;
  pendingMembershipOffer: boolean;
}) {
  if (entitlement?.inner_sanctum_access) {
    return {
      label: "Inner Sanctum",
      eyebrow: "INNER SANCTUM",
      heading: "You're inside me... GASP.",
      body: "You have access to the Inner Sanctum.\n\nThe door is open. Things get a little more intimate from here.",
    };
  }

  if (entitlement?.membership_accepted) {
    return {
      label: "Member",
      eyebrow: "MEMBERSHIP ACTIVE",
      heading: "You're Inside",
      body: "Your membership is active.\n\nThis is only the beginning. New parts of your portal will appear as the journey develops.",
    };
  }

  if (pendingMembershipOffer) {
    return {
      label: "Membership Offered",
      eyebrow: "A DOOR HAS OPENED",
      heading: "A Door Has Opened",
      body: "You've been invited to become a Filthy Princess member.\n\nYou can accept your membership now or explore what lies beyond the Inner Sanctum door.",
    };
  }

  if (hasAdminResponse) {
    return {
      label: "We're Talking",
      eyebrow: "CONVERSATION STARTED",
      heading: "The Conversation Has Started",
      body: "Cally has responded to your enquiry.\n\nTake your time. Read the message, think about it, and reply when you're ready.",
    };
  }

  return {
    label: "Enquiry Received",
    eyebrow: "WHAT HAPPENS NEXT",
    heading: "Your Enquiry Is With Us",
    body: "Your enquiry has been received and will be personally considered.\n\nWe may reach out with a few questions if we'd like to understand you better.\n\nCome back soon to see whether the next part of your journey has opened.",
  };
}

export function formatPortalDate(value: string | null | undefined) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
