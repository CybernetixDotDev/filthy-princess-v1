"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createPrivateAccess,
  signInWithPassword,
} from "@/app/actions/access";
import { submitRetreatEnquiry } from "@/app/actions/enquiries";
import {
  clearPendingEnquiry,
  getPendingEnquiry,
} from "@/lib/enquiries/pending-enquiry";
import { SUPABASE_CONNECTION_ERROR_MESSAGE } from "@/lib/supabase/errors";

type AccessMode = "signin" | "signup";

type AccessFormProps = {
  continueTo: "enquiry" | null;
  initialMessage: string | null;
  isAuthenticated: boolean;
};

export default function AccessForm({
  continueTo,
  initialMessage,
  isAuthenticated,
}: AccessFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AccessMode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(() =>
    initialMessage === "confirmation-failed"
      ? "That confirmation link could not be completed. Please sign in to continue."
      : initialMessage === "auth-unavailable"
        ? SUPABASE_CONNECTION_ERROR_MESSAGE
        : initialMessage === "private-access-needed" ||
            continueTo === "enquiry"
          ? "Create private access or sign in to save your enquiry. Your answers are waiting safely here."
          : "",
  );
  const [isPending, startTransition] = useTransition();

  const finishPendingEnquiry = useCallback(async () => {
    if (continueTo !== "enquiry") {
      router.replace("/portal");
      return;
    }

    const draft = getPendingEnquiry();

    if (!draft) {
      router.replace("/portal");
      return;
    }

    let result;

    try {
      result = await submitRetreatEnquiry(draft);
    } catch {
      setMessage("Your enquiry could not be saved yet. Please try again.");
      return;
    }

    if (result.status === "success") {
      clearPendingEnquiry();
      router.replace("/portal");
      return;
    }

    if (result.status === "unauthenticated") {
      setMessage("Private access is ready. Please sign in again to continue.");
      return;
    }

    setMessage(result.message);
  }, [continueTo, router]);

  useEffect(() => {
    if (isAuthenticated && continueTo === "enquiry" && getPendingEnquiry()) {
      startTransition(async () => {
        await finishPendingEnquiry();
      });
    }
  }, [continueTo, finishPendingEnquiry, isAuthenticated]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      if (mode === "signup") {
        const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
          continueTo === "enquiry" ? "/access?continue=enquiry" : "/portal",
        )}`;

        let result;

        try {
          result = await createPrivateAccess({
            displayName,
            email,
            password,
            redirectTo,
          });
        } catch {
          setMessage(SUPABASE_CONNECTION_ERROR_MESSAGE);
          return;
        }

        if (result.status === "error" || result.status === "check-email") {
          setMessage(result.message);
          return;
        }

        await finishPendingEnquiry();
        return;
      }

      let result;

      try {
        result = await signInWithPassword(email, password);
      } catch {
        setMessage(SUPABASE_CONNECTION_ERROR_MESSAGE);
        return;
      }

      if (result.status === "error") {
        setMessage(result.message);
        return;
      }

      await finishPendingEnquiry();
    });
  }

  return (
    <section className="access-panel" aria-labelledby="access-title">
      <div className="access-copy">
        <p className="section-kicker">Private access</p>
        <h1 id="access-title">Enter quietly.</h1>
        <p>
          This is the threshold for guests beginning the private retreat
          journey with Cally.
        </p>
      </div>

      <form className="access-form" onSubmit={handleSubmit}>
        <div className="access-switch" aria-label="Choose access mode">
          <button
            aria-pressed={mode === "signin"}
            type="button"
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            aria-pressed={mode === "signup"}
            type="button"
            onClick={() => setMode("signup")}
          >
            Create private access
          </button>
        </div>

        {mode === "signup" ? (
          <div className="field-group">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              name="displayName"
              required
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
        ) : null}

        <div className="field-group">
          <label htmlFor="accessEmail">Email</label>
          <input
            autoComplete="email"
            id="accessEmail"
            name="email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="field-group">
          <label htmlFor="accessPassword">Password</label>
          <input
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            id="accessPassword"
            minLength={6}
            name="password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {message ? (
          <p className="form-error" role="status">
            {message}
          </p>
        ) : null}

        <button className="submit-button" disabled={isPending} type="submit">
          {isPending
            ? "Opening..."
            : mode === "signup"
              ? "Create access"
              : "Enter"}
        </button>

        <p className="submission-note">
          Private access does not guarantee an invitation. It simply lets the
          journey remember you.
        </p>
      </form>
    </section>
  );
}
