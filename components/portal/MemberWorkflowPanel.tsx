"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  acceptMembershipOffer,
  reportInnerSanctumPayment,
  sendUserMessage,
} from "@/app/actions/workflow";
import { formatPortalDate, getJourneyState } from "@/lib/workflow/status";

type MemberWorkflowPanelProps = {
  entitlement: {
    is_user: boolean;
    is_admin: boolean;
    membership_accepted: boolean;
    inner_sanctum_access: boolean;
  } | null;
  membershipOffer: {
    id: string;
    status: "pending" | "accepted" | "declined";
    created_at: string;
    responded_at: string | null;
  } | null;
  conversation: {
    id: string;
    updated_at: string;
  } | null;
  messages: {
    id: string;
    sender_role: "admin" | "user";
    body: string;
    created_at: string;
  }[];
  innerSanctumRequest: {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
  } | null;
  innerSanctumTransaction: {
    id: string;
    status: string;
    usd_amount: number | string;
    expected_eth_amount: string;
    receiving_wallet_address: string;
    user_reported_paid_at: string | null;
    user_supplied_transaction_hash: string | null;
    transaction_hash: string | null;
    payment_confirmed_at: string | null;
    access_granted_at: string | null;
    created_at: string;
  } | null;
};

function renderBody(body: string) {
  return body.split("\n\n").map((line) => <p key={line}>{line}</p>);
}

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(Number(value));
}

function getUpgradeContent(
  entitlement: MemberWorkflowPanelProps["entitlement"],
  transaction: MemberWorkflowPanelProps["innerSanctumTransaction"],
) {
  if (entitlement?.inner_sanctum_access) {
    return {
      heading: "The Door Is Open",
      body:
        "Your Inner Sanctum access is active.\n\nA deeper part of the Filthy Princess world is now available to you.",
      status: "Access Granted",
    };
  }

  if (transaction?.status === "payment_confirmed") {
    return {
      heading: "Payment Confirmed",
      body:
        "Your Inner Sanctum payment has been confirmed.\n\nYour access is being prepared.",
      status: "Access Being Prepared",
    };
  }

  if (transaction?.status === "payment_reported") {
    return {
      heading: "Payment Submitted",
      body:
        "You've let us know that your Ethereum transfer has been submitted.\n\nYour payment will be checked manually.\n\nYou don't need to send another payment while this one is being reviewed.",
      status: "Awaiting Confirmation",
    };
  }

  if (transaction?.status === "payment_invited") {
    return {
      heading: "Your Upgrade Is Ready",
      body:
        "The next door is open. View your private payment instructions when you're ready.",
      status: "Payment Instructions Ready",
    };
  }

  return null;
}

export default function MemberWorkflowPanel({
  entitlement,
  membershipOffer,
  conversation,
  messages,
  innerSanctumRequest,
  innerSanctumTransaction,
}: MemberWorkflowPanelProps) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [paymentHash, setPaymentHash] = useState("");
  const [notice, setNotice] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasAdminResponse = messages.some(
    (message) => message.sender_role === "admin",
  );
  const hasPendingOffer = membershipOffer?.status === "pending";
  const upgradeContent = getUpgradeContent(entitlement, innerSanctumTransaction);
  const journey = getJourneyState({
    entitlement,
    hasAdminResponse,
    pendingMembershipOffer: hasPendingOffer,
  });

  const closeModals = useCallback(() => {
    setIsConversationOpen(false);
    setIsOfferOpen(false);
    setIsUpgradeOpen(false);
  }, []);

  useEffect(() => {
    if (!isConversationOpen && !isOfferOpen && !isUpgradeOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModals();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModals, isConversationOpen, isOfferOpen, isUpgradeOpen]);

  function acceptOffer() {
    setNotice("");
    startTransition(async () => {
      const result = await acceptMembershipOffer();
      setNotice(
        result.status === "success"
          ? "Welcome Inside. Your membership is active."
          : result.message,
      );

      if (result.status === "success") {
        setIsOfferOpen(false);
        router.refresh();
      }
    });
  }

  function sendReply() {
    if (!conversation) {
      setNotice("There is no open conversation yet.");
      return;
    }

    setNotice("");
    startTransition(async () => {
      const result = await sendUserMessage(conversation.id, reply);
      setNotice(result.message ?? "");

      if (result.status === "success") {
        setReply("");
        router.refresh();
      }
    });
  }

  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopyNotice(`${label} copied`);
  }

  function reportPayment() {
    if (!innerSanctumTransaction) {
      return;
    }

    if (
      !window.confirm(
        "Have you submitted the Ethereum transfer?\n\nPlease only continue after the transaction has been sent from your wallet.",
      )
    ) {
      return;
    }

    setNotice("");
    startTransition(async () => {
      const result = await reportInnerSanctumPayment(
        innerSanctumTransaction.id,
        paymentHash,
      );
      setNotice(result.message ?? "");

      if (result.status === "success") {
        setPaymentHash("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <section
        className="portal-status"
        data-state={entitlement?.inner_sanctum_access ? "inner-sanctum" : undefined}
        aria-labelledby="status-title"
      >
        <p className="section-kicker">{journey.eyebrow}</p>
        <h2 id="status-title">{journey.heading}</h2>
        {renderBody(journey.body)}
      </section>

      {hasAdminResponse ? (
        <section className="member-callout" aria-labelledby="cally-note-title">
          <div>
            <p className="section-kicker">A NOTE FROM CALLY</p>
            <h2 id="cally-note-title">There Is Something Waiting for You</h2>
            <p>
              Your enquiry has been considered and Cally has sent you a message.
            </p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setIsConversationOpen(true)}
          >
            Open Message
          </button>
        </section>
      ) : null}

      {hasPendingOffer ? (
        <section className="member-callout member-offer" aria-labelledby="offer-title">
          <div>
            <p className="section-kicker">A DOOR HAS OPENED</p>
            <h2 id="offer-title">Membership Offered</h2>
            <p>
              You have been invited further into the Filthy Princess world.
            </p>
          </div>
          <button
            className="primary-cta"
            type="button"
            onClick={() => setIsOfferOpen(true)}
          >
            View Invitation
          </button>
        </section>
      ) : null}

      {upgradeContent ? (
        <section className="member-callout member-upgrade" aria-labelledby="upgrade-title">
          <div>
            <p className="section-kicker">Inner Sanctum</p>
            <h2 id="upgrade-title">{upgradeContent.heading}</h2>
            {renderBody(upgradeContent.body)}
            <span>{upgradeContent.status}</span>
          </div>
          <button
            className="primary-cta"
            type="button"
            onClick={() => setIsUpgradeOpen(true)}
          >
            {innerSanctumTransaction?.status === "payment_invited"
              ? "View Upgrade"
              : "View Status"}
          </button>
        </section>
      ) : null}

      {notice ? (
        <p className="form-error member-notice" role="status">
          {notice}
        </p>
      ) : null}

      {isConversationOpen && conversation ? (
        <div
          className="portal-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModals();
            }
          }}
        >
          <div
            className="portal-modal member-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-conversation-title"
          >
            <button
              className="portal-modal-close"
              type="button"
              aria-label="Close conversation"
              onClick={() => setIsConversationOpen(false)}
            >
              X
            </button>
            <p className="portal-modal-eyebrow">PRIVATE CORRESPONDENCE</p>
            <div className="portal-modal-content">
              <h2 id="member-conversation-title">A Note From Cally</h2>
              <div className="correspondence-list">
                {messages.map((message) => (
                  <article
                    className="correspondence-message"
                    data-role={message.sender_role}
                    key={message.id}
                  >
                    <span>{message.sender_role === "admin" ? "Cally" : "You"}</span>
                    <time>{formatPortalDate(message.created_at)}</time>
                    <p>{message.body}</p>
                  </article>
                ))}
              </div>
              <form
                className="member-reply-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendReply();
                }}
              >
                <label htmlFor="member-reply">Write back</label>
                <textarea
                  id="member-reply"
                  rows={5}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                />
                <button className="submit-button" disabled={isPending} type="submit">
                  {isPending ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {isOfferOpen ? (
        <div
          className="portal-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModals();
            }
          }}
        >
          <div
            className="portal-modal member-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-offer-title"
          >
            <button
              className="portal-modal-close"
              type="button"
              aria-label="Close membership offer"
              onClick={() => setIsOfferOpen(false)}
            >
              X
            </button>
            <p className="portal-modal-eyebrow">MEMBERSHIP OFFER</p>
            <div className="portal-modal-content">
              <h2 id="member-offer-title">You Have Been Offered Membership</h2>
              <p>
                Your enquiry has been considered and we would love to invite you
                a little further into the Filthy Princess world.
              </p>
              <p>
                You can accept Basic Membership and continue exploring the
                portal as new parts of the Filthy Princess world become
                available to you.
              </p>
              <div className="member-offer-actions">
                <button
                  className="submit-button"
                  disabled={isPending}
                  type="button"
                  onClick={acceptOffer}
                >
                  {isPending ? "Accepting..." : "Accept Basic Membership"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isUpgradeOpen && upgradeContent ? (
        <div
          className="portal-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModals();
            }
          }}
        >
          <div
            className="portal-modal member-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-upgrade-title"
          >
            <button
              className="portal-modal-close"
              type="button"
              aria-label="Close Inner Sanctum upgrade"
              onClick={() => setIsUpgradeOpen(false)}
            >
              X
            </button>
            <p className="portal-modal-eyebrow">INNER SANCTUM ACCESS</p>
            <div className="portal-modal-content">
              <h2 id="member-upgrade-title">{upgradeContent.heading}</h2>
              {renderBody(upgradeContent.body)}

              {innerSanctumTransaction?.status === "payment_invited" ? (
                <div className="payment-instructions">
                  <div className="portal-modal-emphasis">
                    <span>Contribution</span>
                    <strong>{formatMoney(innerSanctumTransaction.usd_amount)}</strong>
                  </div>
                  <div className="payment-detail-grid">
                    <div>
                      <span>Amount to send</span>
                      <strong>{innerSanctumTransaction.expected_eth_amount} ETH</strong>
                      <button
                        className="quiet-button"
                        type="button"
                        onClick={() =>
                          copyText(
                            innerSanctumTransaction.expected_eth_amount,
                            "Amount",
                          )
                        }
                      >
                        Copy Amount
                      </button>
                    </div>
                    <div>
                      <span>Ethereum Wallet</span>
                      <strong>{innerSanctumTransaction.receiving_wallet_address}</strong>
                      <button
                        className="quiet-button"
                        type="button"
                        onClick={() =>
                          copyText(
                            innerSanctumTransaction.receiving_wallet_address,
                            "Wallet address",
                          )
                        }
                      >
                        Copy Address
                      </button>
                    </div>
                  </div>
                  <p>
                    Send the required amount to the Ethereum address shown
                    above. Please verify the wallet address carefully before
                    confirming the transaction in your wallet.
                  </p>
                  <p>
                    Once the transfer has been submitted, return here and select
                    Payment Has Been Made. Access is activated only after the
                    payment has been independently confirmed.
                  </p>
                  <label htmlFor="payment-hash">Transaction Hash Optional</label>
                  <input
                    id="payment-hash"
                    placeholder="0x..."
                    value={paymentHash}
                    onChange={(event) => setPaymentHash(event.target.value)}
                  />
                  {copyNotice ? (
                    <p className="form-error" role="status">
                      {copyNotice}
                    </p>
                  ) : null}
                  <button
                    className="submit-button"
                    disabled={isPending}
                    type="button"
                    onClick={reportPayment}
                  >
                    {isPending ? "Submitting..." : "Payment Has Been Made"}
                  </button>
                </div>
              ) : (
                <dl className="portal-details payment-status-details">
                  {innerSanctumRequest ? (
                    <div>
                      <dt>Request Date</dt>
                      <dd>{formatPortalDate(innerSanctumRequest.created_at)}</dd>
                    </div>
                  ) : null}
                  {innerSanctumTransaction ? (
                    <>
                      <div>
                        <dt>Payment Status</dt>
                        <dd>{upgradeContent.status}</dd>
                      </div>
                      <div>
                        <dt>Reported</dt>
                        <dd>{formatPortalDate(innerSanctumTransaction.user_reported_paid_at)}</dd>
                      </div>
                      <div>
                        <dt>Confirmed</dt>
                        <dd>{formatPortalDate(innerSanctumTransaction.payment_confirmed_at)}</dd>
                      </div>
                    </>
                  ) : null}
                </dl>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
