"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";

import { SUPABASE_CONNECTION_ERROR_MESSAGE } from "@/lib/supabase/errors";
import { createClient } from "@/utils/supabase/client";

type ResetState = "checking" | "ready" | "invalid" | "complete";

export default function ResetPasswordPage() {
  const [state, setState] = useState<ResetState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "ready" : "invalid");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setState("ready");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          console.error("Password update failed.", error.message);
          setMessage("We couldn't update your password. Please try again.");
          return;
        }

        setPassword("");
        setConfirmPassword("");
        setState("complete");
      } catch {
        setMessage(SUPABASE_CONNECTION_ERROR_MESSAGE);
      }
    });
  }

  return (
    <main className="access-page section-shell">
      <section className="reset-password-panel" aria-labelledby="reset-title">
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

        {state === "complete" ? (
          <div className="access-form-heading">
            <p className="section-kicker">Password Updated</p>
            <h1 id="reset-title">Your new password is ready.</h1>
            <Link className="submit-button reset-portal-link" href="/portal">
              Continue to Portal
            </Link>
          </div>
        ) : state === "invalid" ? (
          <div className="access-form-heading">
            <p className="section-kicker">Recovery link</p>
            <h1 id="reset-title">This link has expired.</h1>
            <p>
              This password reset link is invalid or has expired. Request a new
              one.
            </p>
            <Link className="submit-button reset-portal-link" href="/access">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form className="access-form reset-password-form" onSubmit={handleSubmit}>
            <div className="access-form-heading">
              <p className="section-kicker">Password recovery</p>
              <h1 id="reset-title">Choose a New Password</h1>
            </div>

            <div className="field-group">
              <label htmlFor="newPassword">New password</label>
              <input
                autoComplete="new-password"
                disabled={state === "checking"}
                id="newPassword"
                minLength={8}
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                autoComplete="new-password"
                disabled={state === "checking"}
                id="confirmPassword"
                minLength={8}
                required
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {message ? (
              <p className="form-error" role="status">
                {message}
              </p>
            ) : null}

            <button
              className="submit-button"
              disabled={isPending || state === "checking"}
              type="submit"
            >
              {isPending ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
