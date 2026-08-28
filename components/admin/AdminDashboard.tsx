"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import {
  beginInnerSanctumUpgrade,
  confirmInnerSanctumPayment,
  grantInnerSanctumAccessForPayment,
  offerMembership,
  sendAdminMessage,
  setInnerSanctumAccess,
} from "@/app/actions/workflow";
import { formatPortalDate, getJourneyState } from "@/lib/workflow/status";

type AdminProfile = {
  email: string | null;
  display_name: string | null;
} | null;

type AdminEntitlement = {
  is_user: boolean;
  is_admin: boolean;
  membership_accepted: boolean;
  inner_sanctum_access: boolean;
} | null;

type AdminConversation = {
  id: string;
  user_id: string;
  enquiry_id: string;
  created_at: string;
  updated_at: string;
} | null;

type AdminMessage = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  sender_role: "admin" | "user";
  body: string;
  created_at: string;
};

type AdminMembershipOffer = {
  id: string;
  user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
} | null;

type AdminInnerSanctumRequest = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
} | null;

type AdminInnerSanctumTransaction = {
  id: string;
  user_id: string;
  upgrade_request_id: string;
  status: string;
  usd_amount: number | string;
  expected_eth_amount: string;
  receiving_wallet_address: string;
  invited_by: string;
  user_reported_paid_at: string | null;
  user_supplied_transaction_hash: string | null;
  transaction_hash: string | null;
  transaction_receipt: string | null;
  admin_payment_notes: string | null;
  payment_confirmed_at: string | null;
  payment_confirmed_by: string | null;
  access_granted_at: string | null;
  access_granted_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminEnquiry = {
  id: string;
  user_id: string;
  submitted_at: string;
  status: string;
  name: string;
  retreat_type: string;
  guest_count: number | null;
  travelling_from: string | null;
  preferred_timing: string | null;
  brought_here: string;
  hoping_to_discover: string | null;
  profile: AdminProfile;
  entitlement: AdminEntitlement;
  conversation: AdminConversation;
  messages: AdminMessage[];
  membershipOffer: AdminMembershipOffer;
  innerSanctumRequest: AdminInnerSanctumRequest;
  innerSanctumTransactions: AdminInnerSanctumTransaction[];
};

type AdminDashboardProps = {
  enquiries: AdminEnquiry[];
  receivingWalletAddress: string;
};

function getDisplayName(enquiry: AdminEnquiry) {
  return enquiry.profile?.display_name || enquiry.name || enquiry.profile?.email || "Guest";
}

function getMembershipLabel(enquiry: AdminEnquiry) {
  if (enquiry.entitlement?.membership_accepted) {
    return "Membership Accepted";
  }

  if (enquiry.membershipOffer?.status === "pending") {
    return "Offer Pending";
  }

  return "Not Offered";
}

function getLatestTransaction(enquiry: AdminEnquiry) {
  return enquiry.innerSanctumTransactions[0] ?? null;
}

function getLastMessageDate(enquiry: AdminEnquiry) {
  return enquiry.messages.at(-1)?.created_at ?? enquiry.conversation?.updated_at ?? null;
}

function hasUpgradeWorkflow(enquiry: AdminEnquiry) {
  return Boolean(enquiry.innerSanctumRequest || getLatestTransaction(enquiry));
}

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(Number(value));
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getUpgradeSignal(enquiry: AdminEnquiry) {
  if (enquiry.entitlement?.inner_sanctum_access) {
    return "Inner Sanctum active";
  }

  const transaction = getLatestTransaction(enquiry);

  if (transaction?.status === "payment_reported") {
    return "Payment reported";
  }

  if (transaction?.status === "payment_confirmed") {
    return "Payment confirmed";
  }

  if (transaction?.status === "payment_invited") {
    return "Payment invitation sent";
  }

  if (enquiry.innerSanctumRequest) {
    return "Inner Sanctum upgrade requested";
  }

  return "";
}

function getAdminSignal(enquiry: AdminEnquiry) {
  const upgradeSignal = getUpgradeSignal(enquiry);

  if (upgradeSignal) {
    return upgradeSignal;
  }

  if (enquiry.membershipOffer?.status === "pending") {
    return "Membership offer pending";
  }

  return getStageLabel(enquiry);
}

function getStageLabel(enquiry: AdminEnquiry) {
  return getJourneyState({
    entitlement: enquiry.entitlement,
    hasAdminResponse: enquiry.messages.some(
      (message) => message.sender_role === "admin",
    ),
    pendingMembershipOffer: enquiry.membershipOffer?.status === "pending",
  }).label;
}

export default function AdminDashboard({
  enquiries,
  receivingWalletAddress,
}: AdminDashboardProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(enquiries[0]?.id ?? "");
  const [openUpgradeId, setOpenUpgradeId] = useState("");
  const [note, setNote] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [transactionReceipt, setTransactionReceipt] = useState("");
  const [adminPaymentNotes, setAdminPaymentNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const selectedEnquiry =
    enquiries.find((enquiry) => enquiry.id === selectedId) ?? enquiries[0] ?? null;
  const latestTransaction = selectedEnquiry
    ? getLatestTransaction(selectedEnquiry)
    : null;
  const isUpgradeOpen = Boolean(
    selectedEnquiry && openUpgradeId === selectedEnquiry.id,
  );

  const newEnquiries = useMemo(
    () =>
      enquiries.filter(
        (enquiry) =>
          !enquiry.messages.some((message) => message.sender_role === "admin"),
      ),
    [enquiries],
  );

  const respondedEnquiries = useMemo(
    () =>
      enquiries.filter(
        (enquiry) =>
          enquiry.messages.some((message) => message.sender_role === "admin") ||
          hasUpgradeWorkflow(enquiry),
      ),
    [enquiries],
  );

  function runAction(action: () => Promise<{ status: string; message?: string }>) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.message ?? "");

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  function selectEnquiry(enquiryId: string) {
    setSelectedId(enquiryId);
    setOpenUpgradeId("");
    setMessage("");
  }

  function renderUpgradeAlert(enquiry: AdminEnquiry) {
    const transaction = getLatestTransaction(enquiry);

    if (enquiry.entitlement?.inner_sanctum_access) {
      return enquiry.innerSanctumRequest ? (
        <button
          className="admin-upgrade-alert admin-upgrade-button"
          type="button"
          onClick={() => setOpenUpgradeId(enquiry.id)}
        >
          <p className="section-kicker">Inner Sanctum</p>
          <h4>Inner Sanctum Active</h4>
          <p>Access has been granted for this member.</p>
          <span>Access Granted</span>
        </button>
      ) : (
        <div className="admin-upgrade-alert">
          <p className="section-kicker">Inner Sanctum</p>
          <h4>Inner Sanctum Active</h4>
          <p>Access has been granted for this member.</p>
          <span>Access Granted</span>
        </div>
      );
    }

    if (transaction?.status === "payment_reported") {
      return (
        <button
          className="admin-upgrade-alert admin-upgrade-button"
          type="button"
          onClick={() => setOpenUpgradeId(enquiry.id)}
        >
          <p className="section-kicker">Payment reported</p>
          <h4>Review Payment</h4>
          <p>The member says their Ethereum transfer has been submitted.</p>
          <span>Open Payment</span>
        </button>
      );
    }

    if (transaction?.status === "payment_confirmed") {
      return (
        <button
          className="admin-upgrade-alert admin-upgrade-button"
          type="button"
          onClick={() => setOpenUpgradeId(enquiry.id)}
        >
          <p className="section-kicker">Payment confirmed</p>
          <h4>Grant Inner Sanctum</h4>
          <p>Payment has been recorded. Access has not yet been granted.</p>
          <span>Open Request</span>
        </button>
      );
    }

    if (transaction?.status === "payment_invited") {
      return (
        <button
          className="admin-upgrade-alert admin-upgrade-button"
          type="button"
          onClick={() => setOpenUpgradeId(enquiry.id)}
        >
          <p className="section-kicker">Payment invitation sent</p>
          <h4>Waiting for Member</h4>
          <p>The upgrade instructions are available in the member portal.</p>
          <span>Open Request</span>
        </button>
      );
    }

    if (enquiry.innerSanctumRequest) {
      return (
        <button
          className="admin-upgrade-alert admin-upgrade-button"
          type="button"
          onClick={() => setOpenUpgradeId(enquiry.id)}
        >
          <p className="section-kicker">Inner Sanctum</p>
          <h4>Upgrade Requested</h4>
          <p>This member has asked to explore Inner Sanctum access.</p>
          <span>Open Request</span>
        </button>
      );
    }

    return null;
  }

  function renderUpgradePanel(enquiry: AdminEnquiry) {
    const request = enquiry.innerSanctumRequest;
    const transaction = getLatestTransaction(enquiry);

    if (!request) {
      return null;
    }

    return (
      <section className="admin-review-section admin-upgrade-panel">
        <h4>Inner Sanctum Upgrade</h4>
        <dl className="admin-answer-list">
          <div>
            <dt>Member</dt>
            <dd>{getDisplayName(enquiry)}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{enquiry.user_id}</dd>
          </div>
          <div>
            <dt>Request Date</dt>
            <dd>{formatPortalDate(request.created_at)}</dd>
          </div>
          <div>
            <dt>Membership</dt>
            <dd>{getMembershipLabel(enquiry)}</dd>
          </div>
          <div>
            <dt>Request Status</dt>
            <dd>{formatStatus(request.status)}</dd>
          </div>
          <div>
            <dt>Payment Status</dt>
            <dd>{transaction ? formatStatus(transaction.status) : "Upgrade Requested"}</dd>
          </div>
          <div>
            <dt>Inner Sanctum</dt>
            <dd>{enquiry.entitlement?.inner_sanctum_access ? "Active" : "Inactive"}</dd>
          </div>
        </dl>

        {!transaction ? (
          <form
            className="admin-payment-form"
            onSubmit={(event) => {
              event.preventDefault();
              runAction(async () => {
                const result = await beginInnerSanctumUpgrade(request.id, ethAmount);

                if (result.status === "success") {
                  setEthAmount("");
                }

                return result;
              });
            }}
          >
            <div>
              <p className="section-kicker">Price</p>
              <strong>USD $500</strong>
            </div>
            <label htmlFor="required-eth">Required ETH</label>
            <input
              id="required-eth"
              inputMode="decimal"
              placeholder="0.123456"
              value={ethAmount}
              onChange={(event) => setEthAmount(event.target.value)}
            />
            <label htmlFor="receiving-wallet">Receiving wallet</label>
            <input
              id="receiving-wallet"
              readOnly
              value={receivingWalletAddress || "INNER_SANCTUM_ETH_WALLET_ADDRESS is not configured"}
            />
            <button
              className="submit-button"
              disabled={isPending || !receivingWalletAddress}
              type="submit"
            >
              {isPending ? "Sending..." : "Send Payment Invitation"}
            </button>
          </form>
        ) : (
          <div className="admin-transaction-current">
            <dl className="admin-answer-list">
              <div>
                <dt>Payment Invitation</dt>
                <dd>{formatPortalDate(transaction.created_at)}</dd>
              </div>
              <div>
                <dt>USD Amount</dt>
                <dd>{formatMoney(transaction.usd_amount)}</dd>
              </div>
              <div>
                <dt>Expected ETH</dt>
                <dd>{transaction.expected_eth_amount} ETH</dd>
              </div>
              <div>
                <dt>Receiving Wallet</dt>
                <dd className="monospace-value">{transaction.receiving_wallet_address}</dd>
              </div>
              <div>
                <dt>User Reported</dt>
                <dd>{formatPortalDate(transaction.user_reported_paid_at)}</dd>
              </div>
              <div>
                <dt>User Supplied Hash</dt>
                <dd>{transaction.user_supplied_transaction_hash || "Not supplied"}</dd>
              </div>
            </dl>

            {transaction.status === "payment_reported" ? (
              <form
                className="admin-payment-form"
                onSubmit={(event) => {
                  event.preventDefault();

                  if (
                    !window.confirm(
                      "Confirm this payment?\n\nOnly continue after you have independently verified that the funds have reached the receiving wallet.",
                    )
                  ) {
                    return;
                  }

                  runAction(async () => {
                    const result = await confirmInnerSanctumPayment(
                      transaction.id,
                      transactionHash,
                      transactionReceipt,
                      adminPaymentNotes,
                    );

                    if (result.status === "success") {
                      setTransactionHash("");
                      setTransactionReceipt("");
                      setAdminPaymentNotes("");
                    }

                    return result;
                  });
                }}
              >
                <label htmlFor="transaction-hash">Transaction Hash / Receipt</label>
                <input
                  id="transaction-hash"
                  placeholder="0x..."
                  value={transactionHash}
                  onChange={(event) => setTransactionHash(event.target.value)}
                />
                <label htmlFor="transaction-receipt">Admin Notes</label>
                <textarea
                  id="transaction-receipt"
                  rows={4}
                  value={transactionReceipt}
                  onChange={(event) => setTransactionReceipt(event.target.value)}
                />
                <label htmlFor="admin-payment-notes">Internal Payment Notes</label>
                <textarea
                  id="admin-payment-notes"
                  rows={3}
                  value={adminPaymentNotes}
                  onChange={(event) => setAdminPaymentNotes(event.target.value)}
                />
                <button className="submit-button" disabled={isPending} type="submit">
                  {isPending ? "Confirming..." : "Confirm Payment"}
                </button>
              </form>
            ) : null}

            {transaction.status === "payment_confirmed" ? (
              <div className="admin-control-row">
                <div>
                  <strong>Payment Confirmed</strong>
                  <span>Access has not yet been granted.</span>
                </div>
                <button
                  className="submit-button"
                  disabled={isPending}
                  type="button"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Grant Inner Sanctum access to this member?\n\nThis will unlock the member's Inner Sanctum entitlement.",
                      )
                    ) {
                      return;
                    }

                    runAction(() =>
                      grantInnerSanctumAccessForPayment(
                        enquiry.user_id,
                        transaction.id,
                      ),
                    );
                  }}
                >
                  Grant Inner Sanctum Access
                </button>
              </div>
            ) : null}
          </div>
        )}

        {enquiry.innerSanctumTransactions.length ? (
          <div className="admin-transaction-history">
            <h4>Upgrade Transactions</h4>
            {enquiry.innerSanctumTransactions.map((transaction) => (
              <dl className="admin-answer-list" key={transaction.id}>
                <div>
                  <dt>Date</dt>
                  <dd>{formatPortalDate(transaction.created_at)}</dd>
                </div>
                <div>
                  <dt>USD Value</dt>
                  <dd>{formatMoney(transaction.usd_amount)}</dd>
                </div>
                <div>
                  <dt>ETH Amount</dt>
                  <dd>{transaction.expected_eth_amount} ETH</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{formatStatus(transaction.status)}</dd>
                </div>
                <div>
                  <dt>Transaction Hash</dt>
                  <dd>{transaction.transaction_hash || "Not recorded"}</dd>
                </div>
                <div>
                  <dt>Confirmed</dt>
                  <dd>{formatPortalDate(transaction.payment_confirmed_at)}</dd>
                </div>
                <div>
                  <dt>Access Granted</dt>
                  <dd>{formatPortalDate(transaction.access_granted_at)}</dd>
                </div>
              </dl>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <main className="admin-page section-shell">
      <header className="admin-header">
        <div>
          <p className="section-kicker">Private admin</p>
          <h1>Enquiry Review</h1>
        </div>
        <form action={signOut}>
          <button className="quiet-button" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="admin-board" aria-label="Admin enquiry workspace">
        <div className="admin-panel">
          <div className="admin-panel-heading">
            <h2>New Enquiries</h2>
            <span>{newEnquiries.length}</span>
          </div>
          <div className="admin-list">
            {newEnquiries.length ? (
              newEnquiries.map((enquiry) => (
                <button
                  className="admin-list-item"
                  data-selected={selectedEnquiry?.id === enquiry.id}
                  key={enquiry.id}
                  type="button"
                  onClick={() => selectEnquiry(enquiry.id)}
                >
                  <span>{getDisplayName(enquiry)}</span>
                  <small>
                    {formatPortalDate(enquiry.submitted_at)} - {enquiry.retreat_type}
                  </small>
                  <em>{getAdminSignal(enquiry)}</em>
                </button>
              ))
            ) : (
              <p className="admin-empty">No new enquiries are waiting.</p>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Conversations</h2>
            <span>{respondedEnquiries.length}</span>
          </div>
          <div className="admin-list">
            {respondedEnquiries.length ? (
              respondedEnquiries.map((enquiry) => (
                <button
                  className="admin-list-item"
                  data-selected={selectedEnquiry?.id === enquiry.id}
                  key={enquiry.id}
                  type="button"
                  onClick={() => selectEnquiry(enquiry.id)}
                >
                  <span>{getDisplayName(enquiry)}</span>
                  <small>
                    {enquiry.retreat_type} - {formatPortalDate(getLastMessageDate(enquiry))}
                  </small>
                  <em>{getAdminSignal(enquiry)}</em>
                </button>
              ))
            ) : (
              <p className="admin-empty">No conversation has started yet.</p>
            )}
          </div>
        </div>

        <div className="admin-panel admin-panel-wide">
          <div className="admin-panel-heading">
            <h2>User Interaction</h2>
            {selectedEnquiry ? <span>{getStageLabel(selectedEnquiry)}</span> : null}
          </div>

          {selectedEnquiry ? (
            <article className="admin-review">
              <div className="admin-review-hero">
                <div>
                  <p className="section-kicker">Profile</p>
                  <h3>{getDisplayName(selectedEnquiry)}</h3>
                  <p>{selectedEnquiry.profile?.email || "No email available"}</p>
                </div>
                <dl className="admin-meta">
                  <div>
                    <dt>Retreat</dt>
                    <dd>{selectedEnquiry.retreat_type}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatPortalDate(selectedEnquiry.submitted_at)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{selectedEnquiry.status}</dd>
                  </div>
                </dl>
              </div>

              <section className="admin-review-section">
                <h4>Enquiry</h4>
                <dl className="admin-answer-list">
                  <div>
                    <dt>What brought them here?</dt>
                    <dd>{selectedEnquiry.brought_here}</dd>
                  </div>
                  {selectedEnquiry.hoping_to_discover ? (
                    <div>
                      <dt>Hoping to discover</dt>
                      <dd>{selectedEnquiry.hoping_to_discover}</dd>
                    </div>
                  ) : null}
                  {selectedEnquiry.travelling_from ? (
                    <div>
                      <dt>Travelling from</dt>
                      <dd>{selectedEnquiry.travelling_from}</dd>
                    </div>
                  ) : null}
                  {selectedEnquiry.preferred_timing ? (
                    <div>
                      <dt>Timing</dt>
                      <dd>{selectedEnquiry.preferred_timing}</dd>
                    </div>
                  ) : null}
                  {selectedEnquiry.guest_count ? (
                    <div>
                      <dt>Guests</dt>
                      <dd>{selectedEnquiry.guest_count}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="admin-review-section">
                <h4>Conversation</h4>
                <div className="correspondence-list">
                  {selectedEnquiry.messages.length ? (
                    selectedEnquiry.messages.map((conversationMessage) => (
                      <article
                        className="correspondence-message"
                        data-role={conversationMessage.sender_role}
                        key={conversationMessage.id}
                      >
                        <span>
                          {conversationMessage.sender_role === "admin"
                            ? "Cally"
                            : getDisplayName(selectedEnquiry)}
                        </span>
                        <time>{formatPortalDate(conversationMessage.created_at)}</time>
                        <p>{conversationMessage.body}</p>
                      </article>
                    ))
                  ) : (
                    <p className="admin-empty">No conversation has started yet.</p>
                  )}
                </div>

                <form
                  className="admin-note-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    runAction(async () => {
                      const result = await sendAdminMessage(selectedEnquiry.id, note);

                      if (result.status === "success") {
                        setNote("");
                      }

                      return result;
                    });
                  }}
                >
                  <label htmlFor="admin-note">Send a Little Note</label>
                  <p>Ask a question, share a thought, or invite them to tell you a little more.</p>
                  <textarea
                    id="admin-note"
                    rows={5}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <button className="submit-button" disabled={isPending} type="submit">
                    {isPending ? "Sending..." : "Send note"}
                  </button>
                </form>
              </section>

              <section className="admin-review-section admin-controls">
                {renderUpgradeAlert(selectedEnquiry)}
                {isUpgradeOpen ? renderUpgradePanel(selectedEnquiry) : null}

                <div>
                  <h4>Current Access</h4>
                  <div className="access-labels">
                    {selectedEnquiry.entitlement?.is_user ? <span>User</span> : null}
                    {selectedEnquiry.entitlement?.membership_accepted ? (
                      <span>Basic Membership Accepted</span>
                    ) : null}
                    {selectedEnquiry.entitlement?.inner_sanctum_access ? (
                      <span>Inner Sanctum</span>
                    ) : null}
                    {selectedEnquiry.entitlement?.is_admin ? <span>Admin</span> : null}
                  </div>
                </div>

                <div className="admin-control-row">
                  <div>
                    <strong>Basic Membership</strong>
                    <span>{getMembershipLabel(selectedEnquiry)}</span>
                  </div>
                  <button
                    className="secondary-button"
                    disabled={
                      isPending ||
                      selectedEnquiry.entitlement?.membership_accepted ||
                      selectedEnquiry.membershipOffer?.status === "pending"
                    }
                    type="button"
                    onClick={() =>
                      runAction(() => offerMembership(selectedEnquiry.user_id))
                    }
                  >
                    {selectedEnquiry.entitlement?.membership_accepted
                      ? "Membership Accepted"
                      : selectedEnquiry.membershipOffer?.status === "pending"
                        ? "Offer Pending"
                        : "Offer Membership"}
                  </button>
                </div>

                <div className="admin-control-row">
                  <div>
                    <strong>Inner Sanctum Access</strong>
                    <span>
                      {selectedEnquiry.entitlement?.inner_sanctum_access
                        ? "Active"
                        : latestTransaction
                          ? `Payment: ${formatStatus(latestTransaction.status)}`
                          : selectedEnquiry.innerSanctumRequest
                            ? `Request: ${formatStatus(selectedEnquiry.innerSanctumRequest.status)}`
                            : "Inactive"}
                    </span>
                  </div>
                  {selectedEnquiry.entitlement?.inner_sanctum_access ? (
                    <button
                      className="secondary-button"
                      disabled={isPending}
                      type="button"
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Remove Inner Sanctum access from this member?",
                          )
                        ) {
                          return;
                        }

                        runAction(() =>
                          setInnerSanctumAccess(selectedEnquiry.user_id, false),
                        );
                      }}
                    >
                      Revoke Access
                    </button>
                  ) : (
                    <button className="quiet-button" disabled type="button">
                      Managed Through Payment
                    </button>
                  )}
                </div>
              </section>

              {message ? (
                <p className="form-error admin-action-message" role="status">
                  {message}
                </p>
              ) : null}
            </article>
          ) : (
            <p className="admin-empty">No enquiries have arrived yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
