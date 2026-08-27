"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { submitRetreatEnquiry } from "@/app/actions/enquiries";
import { savePendingEnquiry } from "@/lib/enquiries/pending-enquiry";
import {
  EnquiryPayload,
  RETREAT_TYPES,
  createSubmissionKey,
  normalizeEnquiryPayload,
} from "@/lib/enquiries/types";

const initialValues: EnquiryPayload = {
  name: "",
  retreatType: "Solo",
  guestCount: "",
  travellingFrom: "",
  preferredTiming: "",
  broughtHere: "",
  hopingToDiscover: "",
};

export default function EnquiryForm() {
  const router = useRouter();
  const [values, setValues] = useState<EnquiryPayload>(initialValues);
  const [submissionKey] = useState(createSubmissionKey);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const missingRequired = useMemo(
    () => !values.name.trim() || !values.broughtHere.trim(),
    [values],
  );

  function updateValue(field: keyof EnquiryPayload, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);
    setMessage("");

    if (missingRequired) {
      return;
    }

    const draft = normalizeEnquiryPayload({
      ...values,
      submissionKey,
    });

    startTransition(async () => {
      try {
        const result = await submitRetreatEnquiry(draft);

        if (result.status === "success") {
          router.push("/portal");
          return;
        }

        if (result.status === "unauthenticated") {
          savePendingEnquiry(draft);
          router.push("/access?continue=enquiry&message=private-access-needed");
          return;
        }

        setMessage(result.message);
      } catch {
        savePendingEnquiry(draft);
        router.push("/access?continue=enquiry&message=private-access-needed");
      }
    });
  }

  return (
    <section
      className="enquiry section-shell page-section"
      id="enquiry"
      aria-labelledby="enquiry-title"
    >
      <div className="enquiry-intro">
        <p className="section-kicker">Enquiry</p>
        <h2 id="enquiry-title">You found the door.</h2>
        <p>
          Every journey begins with curiosity. Tell me a little about yourself,
          what brought you here, and what made you wonder whether Filthy
          Princess might be somewhere you belong.
        </p>
      </div>

      <div className="form-shell">
        <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              required
              type="text"
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              aria-invalid={attemptedSubmit && !values.name.trim()}
            />
          </div>

          <fieldset className="retreat-choice field-wide">
            <legend>
              Retreat type <span aria-hidden="true">*</span>
            </legend>
            <div className="choice-grid">
              {RETREAT_TYPES.map((type) => (
                <label
                  className="choice-pill"
                  data-selected={values.retreatType === type}
                  key={type}
                >
                  <input
                    name="retreatType"
                    type="radio"
                    value={type}
                    checked={values.retreatType === type}
                    onChange={(event) =>
                      updateValue("retreatType", event.target.value)
                    }
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field-group">
            <label htmlFor="guestCount">Number of guests</label>
            <input
              id="guestCount"
              inputMode="numeric"
              min={1}
              name="guestCount"
              type="number"
              value={values.guestCount}
              onChange={(event) =>
                updateValue("guestCount", event.target.value)
              }
            />
          </div>

          <div className="field-group">
            <label htmlFor="travellingFrom">Travelling from</label>
            <input
              id="travellingFrom"
              name="travellingFrom"
              type="text"
              value={values.travellingFrom}
              onChange={(event) =>
                updateValue("travellingFrom", event.target.value)
              }
            />
          </div>

          <div className="field-group field-wide">
            <label htmlFor="preferredTiming">Roughly when?</label>
            <input
              id="preferredTiming"
              name="preferredTiming"
              placeholder="Spring, September, soon..."
              type="text"
              value={values.preferredTiming}
              onChange={(event) =>
                updateValue("preferredTiming", event.target.value)
              }
            />
          </div>

          <div className="field-group field-wide">
            <label htmlFor="broughtHere">What brought you here?</label>
            <textarea
              id="broughtHere"
              name="broughtHere"
              required
              rows={5}
              placeholder="Tell Cally what made you curious..."
              value={values.broughtHere}
              onChange={(event) =>
                updateValue("broughtHere", event.target.value)
              }
              aria-invalid={attemptedSubmit && !values.broughtHere.trim()}
            />
          </div>

          <div className="field-group field-wide">
            <label htmlFor="hopingToDiscover">
              What are you hoping to discover?
            </label>
            <textarea
              id="hopingToDiscover"
              name="hopingToDiscover"
              rows={4}
              value={values.hopingToDiscover}
              onChange={(event) =>
                updateValue("hopingToDiscover", event.target.value)
              }
            />
          </div>

          {attemptedSubmit && missingRequired ? (
            <p className="form-error" role="alert">
              Please share your name and what brought you here.
            </p>
          ) : null}

          {message ? (
            <p className="form-error" role="alert">
              {message}
            </p>
          ) : null}

          <button className="submit-button" disabled={isPending} type="submit">
            {isPending ? "Sending..." : "Send my enquiry"}
          </button>

          <p className="submission-note">
            Submitting an enquiry is not a booking or commitment. If it feels
            like something I can create beautifully, I will contact you
            personally.
          </p>
        </form>
      </div>
    </section>
  );
}
