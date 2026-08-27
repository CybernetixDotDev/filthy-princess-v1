# Filthy Princess V1 Project Overview

Last updated: 2026-08-27

## What This Is

Filthy Princess V1 is a standalone Next.js app for a private adult retreat experience.

It currently has two main surfaces:

- A public landing page that introduces the retreat world and invites an enquiry.
- A private access and portal flow backed by Supabase Auth and Supabase Postgres.

The project is intentionally small and direct. The public site builds atmosphere and context; the portal gives guests a private place to return to after creating an account and submitting an enquiry.

## Tech Stack

- Next.js `16.3.3` with the App Router
- React `19.2.8`
- Supabase Auth for email/password accounts and confirmation links
- Supabase Postgres for profiles and retreat enquiries
- `@supabase/ssr` for server/client Supabase clients

## Public Landing Page

The homepage is composed in `app/page.tsx`.

Sections:

- `components/Hero.tsx`: First viewport, brand signal, private access link, and `public/EnchantedLace.png`.
- `components/CallyIntroduction.tsx`: Introduces Cally and the tone of the experience.
- `components/JourneySection.tsx`: Explains the retreat journey from discovery through arrival.
- `components/PrivatePortalSection.tsx`: Describes the pre-retreat private world.
- `components/ExperienceSection.tsx`: Frames the nature of the experience.
- `components/EnquiryForm.tsx`: Collects an enquiry draft.
- `components/Closing.tsx`: Closing invitation.

Global visual styling lives in `app/globals.css`.

## Enquiry Flow

The enquiry form no longer asks for an email address. This avoids confusion between an enquiry email and the confirmed account email.

Current required enquiry fields:

- Name
- Retreat type
- What brought you here

Optional enquiry fields:

- Number of guests
- Travelling from
- Rough timing
- What you hope to discover

When a visitor submits an enquiry:

1. `components/EnquiryForm.tsx` normalizes the form with `normalizeEnquiryPayload`.
2. It calls the server action `submitRetreatEnquiry`.
3. If the visitor is not authenticated, the draft is saved to localStorage with the key `filthyprincess_pending_enquiry`.
4. The visitor is sent to `/access?continue=enquiry&message=private-access-needed`.
5. The access page explains that private access is needed to save the enquiry.
6. After sign-in or email-confirmed sign-up, `components/AccessForm.tsx` submits the pending enquiry and clears localStorage.
7. The visitor is sent to `/portal`.

This means localStorage holds only the pending enquiry draft, not passwords or Supabase tokens.

## Private Access Flow

Route: `app/access/page.tsx`

Client UI: `components/AccessForm.tsx`

Server actions:

- `app/actions/access.ts`
  - `signInWithPassword`
  - `createPrivateAccess`
- `app/actions/auth.ts`
  - `signOut`

Email confirmation route:

- `app/auth/confirm/route.ts`

The confirmation route accepts Supabase `code` links and `token_hash` links. On success it redirects to the requested `next` path, usually `/portal` or `/access?continue=enquiry`.

## Portal Flow

Route: `app/portal/page.tsx`

The portal checks the current Supabase user server-side. If no user is verified, it redirects to `/access`.

When a user is authenticated, the portal loads:

- The user profile from `public.profiles`
- The latest enquiry from `public.retreat_enquiries`

The portal currently shows:

- A welcome header
- Latest enquiry status, if one exists
- A short "what happens next" sequence
- Placeholder private rooms for future portal content

## Supabase Client Files

- `utils/supabase/client.ts`: Browser Supabase client.
- `utils/supabase/server.ts`: Server Supabase client using Next cookies.
- `utils/supabase/middleware.ts`: Session refresh helper used by `proxy.ts`.
- `proxy.ts`: Next 16 proxy entry point. It runs session refresh for normal app routes while excluding static/image assets.

Supabase connection failures are normalized in:

- `lib/supabase/errors.ts`

This prevents raw `fetch failed` errors from being shown to visitors.

## Database Schema

Migrations live in `supabase/migrations`.

### Foundation Migration

`20260827130000_create_retreat_portal_foundation.sql`

Creates:

- `public.enquiry_status` enum
- `public.profiles`
- `public.retreat_enquiries`
- Profile backfill from existing `auth.users`
- Updated-at triggers
- New-user profile trigger
- RLS policies
- Grants for authenticated users

Important security behavior:

- Users can select only their own profile.
- Users can update only their own `display_name`.
- Users can select only their own retreat enquiries.
- Users can insert only their own submitted enquiries.
- `admin_notes` cannot be inserted by the user.

### Remove Enquiry Email Migration

`20260827141140_remove_enquiry_email.sql`

Drops the now-redundant `email` column from `public.retreat_enquiries`.

The account email now lives in `public.profiles.email`, sourced from Supabase Auth.

## Environment Variables

Required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Currently no service role key is needed for the app flow. If server-only admin operations are added later, use a non-public variable such as:

```bash
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose a service role key through `NEXT_PUBLIC_`.

## Operational Notes

After changing `.env.local`, restart `npm run dev`. Next reads environment variables when the dev server starts.

After adding a migration, apply it to the Supabase project before testing code that depends on the new schema.

The build currently warns if `NODE_TLS_REJECT_UNAUTHORIZED=0` is set in the shell or system environment. That disables TLS verification and should be removed outside short-lived local debugging.

## Current Verification

The latest known checks are:

```bash
npm run lint
npm run build
```

Both passed after the private access and enquiry flow changes.

## Likely Next Steps

- Apply `20260827141140_remove_enquiry_email.sql` to the live Supabase project if it has not already been applied.
- Test the full logged-out enquiry flow in the browser.
- Add an admin view or admin-only workflow for reviewing enquiries.
- Decide how accepted guests should unlock richer private portal content.
- Replace or remove unused public image assets once the final visual direction settles.
