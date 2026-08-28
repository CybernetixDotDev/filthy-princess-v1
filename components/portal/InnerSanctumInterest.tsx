"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { expressInnerSanctumInterest } from "@/app/actions/workflow";

type InnerSanctumInterestProps = {
  currentStatus: string | null;
};

export default function InnerSanctumInterest({
  currentStatus,
}: InnerSanctumInterestProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const hasInterest = Boolean(currentStatus);

  return (
    <div className="inner-interest">
      {currentStatus ? (
        <p className="form-error" role="status">
          Current request status: {currentStatus}
        </p>
      ) : null}

      {message ? (
        <p className="form-error" role="status">
          {message}
        </p>
      ) : null}

      <div className="inner-actions">
        <button
          className="submit-button"
          disabled={isPending || hasInterest}
          type="button"
          onClick={() => {
            setMessage("");
            startTransition(async () => {
              const result = await expressInnerSanctumInterest();
              setMessage(result.message ?? "");

              if (result.status === "success") {
                router.refresh();
              }
            });
          }}
        >
          {isPending
            ? "Sending..."
            : hasInterest
              ? "Interest Received"
              : "I'm Interested"}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => router.push("/portal")}
        >
          Back to Portal
        </button>
      </div>
    </div>
  );
}
