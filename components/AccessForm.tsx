"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  createPrivateAccess,
  requestPasswordReset,
  signInWithPassword,
} from "@/app/actions/access";
import { submitRetreatEnquiry } from "@/app/actions/enquiries";
import {
  clearPendingEnquiry,
  getPendingEnquiry,
} from "@/lib/enquiries/pending-enquiry";
import { SUPABASE_CONNECTION_ERROR_MESSAGE } from "@/lib/supabase/errors";
import { createClient } from "@/utils/supabase/client";

type AccessMode = "signin" | "signup" | "reset";

const OAUTH_NEXT_COOKIE = "filthyprincess_oauth_next";

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [message, setMessage] = useState(() =>
    initialMessage === "confirmation-failed"
      ? "That confirmation link could not be completed. Please sign in to continue."
      : initialMessage === "recovery-failed"
        ? "This password reset link is invalid or has expired. Request a new one."
        : initialMessage === "oauth-failed"
          ? "We couldn't complete Google sign-in. Please try again."
          : initialMessage === "auth-unavailable"
            ? SUPABASE_CONNECTION_ERROR_MESSAGE
            : initialMessage === "private-access-needed" ||
                continueTo === "enquiry"
              ? "Create private access or sign in to save your enquiry. Your answers are waiting safely here."
              : "",
  );
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || googleLoading;

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

  async function handleGoogleSignIn() {
    setMessage("");
    setGoogleLoading(true);

    const next =
      continueTo === "enquiry" ? "/access?continue=enquiry" : "/portal";
    const redirectTo = `${window.location.origin}/auth/callback`;
    const secureCookie = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(
      next,
    )}; Path=/; Max-Age=600; SameSite=Lax${secureCookie}`;

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        console.error("Google sign-in failed.", error.message);
        setMessage("We couldn't complete Google sign-in. Please try again.");
        setGoogleLoading(false);
      }
    } catch {
      setMessage(SUPABASE_CONNECTION_ERROR_MESSAGE);
      setGoogleLoading(false);
    }
  }

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
    setResetSent(false);

    startTransition(async () => {
      if (mode === "reset") {
        const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
          "/access/reset-password",
        )}`;

        let result;

        try {
          result = await requestPasswordReset(email, redirectTo);
        } catch {
          setMessage(SUPABASE_CONNECTION_ERROR_MESSAGE);
          return;
        }

        if (result.status === "error") {
          setMessage(result.message);
          return;
        }

        setResetSent(true);
        setMessage(result.message);
        return;
      }

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
        <div className="access-logo-wrap">
          <Image
            alt="Filthy Princess"
            className="access-logo"
            height={140}
            loading="eager"
            src="/FilthyPrincessLogo.png"
            width={420}
          />
        </div>

        {mode === "reset" ? (
          <div className="access-form-heading">
            <p className="section-kicker">Password recovery</p>
            <h2>Reset Your Password</h2>
            <p>
              Enter the email address you use for Filthy Princess and we will
              send you a secure password reset link.
            </p>
          </div>
        ) : (
          <>
            <div className="access-switch" aria-label="Choose access mode">
              <button
                aria-pressed={mode === "signin"}
                disabled={isBusy}
                type="button"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
              <button
                aria-pressed={mode === "signup"}
                disabled={isBusy}
                type="button"
                onClick={() => setMode("signup")}
              >
                Create private access
              </button>
            </div>

            <button
              className="google-auth-button"
              disabled={isBusy}
              type="button"
              onClick={handleGoogleSignIn}
            >
              <span aria-hidden="true" className="google-mark">
                G
              </span>
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            <div className="access-divider" role="separator">
              <span>or</span>
            </div>
          </>
        )}

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

        {mode !== "reset" ? (
          <div className="field-group">
            <label htmlFor="accessPassword">Password</label>
            <input
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              id="accessPassword"
              minLength={6}
              name="password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {mode === "signin" ? (
              <button
                className="text-link-button"
                disabled={isBusy}
                type="button"
                onClick={() => {
                  setMessage("");
                  setMode("reset");
                }}
              >
                Forgot your password?
              </button>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <p className="form-error" role="status">
            {resetSent ? <strong>Check Your Inbox</strong> : null}
            {message}
          </p>
        ) : null}

        <button className="submit-button" disabled={isBusy} type="submit">
          {isPending
            ? mode === "reset"
              ? "Sending..."
              : "Opening..."
            : mode === "reset"
              ? "Send Reset Link"
              : mode === "signup"
              ? "Create access"
              : "Enter"}
        </button>

        {mode === "reset" ? (
          <button
            className="text-link-button back-link-button"
            disabled={isBusy}
            type="button"
            onClick={() => {
              setMessage("");
              setResetSent(false);
              setMode("signin");
            }}
          >
            Back to Sign In
          </button>
        ) : null}

        {mode !== "reset" ? (
          <p className="submission-note">
            Private access does not guarantee an invitation. It simply lets the
            journey remember you.
          </p>
        ) : null}
      </form>
    </section>
  );
}
