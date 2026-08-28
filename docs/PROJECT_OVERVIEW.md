# Filthy Princess V1 Project Overview

Last updated: 2026-08-28

## What This Is

Filthy Princess V1 is a standalone Next.js app for a private adult retreat experience.

It currently has two main surfaces:

- A public landing page that introduces the retreat world and invites an enquiry.
- A private access and portal flow backed by Supabase Auth and Supabase Postgres.
- A hidden admin review surface for human-reviewed enquiries, conversations, and membership access.

The project is intentionally small and direct. The public site builds atmosphere and context; the portal gives guests a private place to return to after creating an account and submitting an enquiry.

## Tech Stack

- Next.js `16.3.3` with the App Router
- React `19.2.8`
- Supabase Auth for email/password accounts and confirmation links
- Supabase Auth Google provider for OAuth sign-up/sign-in
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
  - `requestPasswordReset`
- `app/actions/auth.ts`
  - `signOut`

Email confirmation route:

- `app/auth/confirm/route.ts`

OAuth callback route:

- `app/auth/callback/route.ts`

The confirmation route accepts Supabase `code` links and `token_hash` links. On success it redirects to the requested relative `next` path, usually `/portal`, `/access?continue=enquiry`, or `/access/reset-password`.

The Google OAuth button uses Supabase's configured Google provider and redirects to the exact app callback URL at `/auth/callback`. If the user was saving an enquiry, a short-lived same-site cookie carries `/access?continue=enquiry` through the OAuth round trip so the existing localStorage draft submission flow can complete after `/auth/callback` exchanges the code.

Password reset requests use `/auth/confirm` as the Supabase recovery redirect and then land on `/access/reset-password`, where a valid recovery session can update the password.

## Portal Flow

Route: `app/portal/page.tsx`

The portal checks the current Supabase user server-side. If no user is verified, it redirects to `/access`.

When a user is authenticated, the portal loads:

- The user profile from `public.profiles`
- The latest enquiry from `public.retreat_enquiries`

The portal currently shows:

- A welcome header
- Latest enquiry status, if one exists
- A derived journey status based on conversation, offers, and entitlements
- A short "what happens next" sequence
- A private correspondence area when Cally/admin has replied
- A membership offer invitation when Basic Membership has been offered
- A subtle footer upgrade link to Inner Sanctum once Basic Membership is active
- Inner Sanctum payment status alerts once an admin has opened an upgrade
- Interactive private-room content tiles that open detailed modals

Portal content is split between:

- `lib/portal/content.ts`: Typed content records, retreat-type normalization, and What to Expect experience mappings.
- `components/PortalContentGateways.tsx`: Client-side tile grid, accessible modal behavior, and What to Expect tabs.

The What to Expect tile uses the latest enquiry's `retreat_type` field to choose the default dashboard title, teaser, and active modal tab. Current normalized values are:

- `Solo` -> `solo`
- `Couples` -> `couples`
- `Private Group` -> `group`
- `I am not sure yet` -> `custom`

Unknown or missing retreat types fall back to a generic What to Expect tile.

## Admin Workflow

Route: `app/admin/page.tsx`

There are no public links to `/admin`. Access is guarded server-side by checking the signed-in user's `public.user_entitlements.is_admin` value. Non-admin users are redirected to `/portal`.

Admin UI:

- `components/admin/AdminDashboard.tsx`

Admin server actions:

- `sendAdminMessage`
- `offerMembership`
- `beginInnerSanctumUpgrade`
- `confirmInnerSanctumPayment`
- `grantInnerSanctumAccessForPayment`
- `setInnerSanctumAccess`

These live in `app/actions/workflow.ts`. Each admin action derives the signed-in user from the Supabase session and verifies admin entitlement before mutating data.

The admin dashboard has three working areas:

- New Enquiries
- Conversations
- User Interaction

The User Interaction panel shows the profile/enquiry summary, chronological conversation, current access labels, Basic Membership status, Inner Sanctum payment workflow, and a revoke-only Inner Sanctum access control once access is active.

## Conversation And Membership Workflow

Conversation model:

- `public.conversations`: one conversation per enquiry.
- `public.conversation_messages`: chronological messages with server-derived sender role.

Membership model:

- `public.membership_offers`: pending/accepted/declined Basic Membership offers.
- `public.user_entitlements.membership_accepted`: set when the user accepts a pending offer.

The user accepts membership through `public.accept_membership_offer()`, a guarded database function called by the server action. This avoids exposing direct entitlement self-grants through the normal client.

Inner Sanctum model:

- `public.inner_sanctum_requests`: records that a user expressed interest.
- `public.inner_sanctum_transactions`: records manual payment invitations, reported payments, admin confirmations, and final access grants.
- `public.user_entitlements.inner_sanctum_access`: manually granted or revoked by an admin.

Route:

- `app/access/inner-sanctum/page.tsx`

The Inner Sanctum page begins the manual application/payment path. It is reached as a post-membership upgrade path from the portal footer. It does not connect wallets, request seed phrases, custody funds, or automatically activate access.

Manual payment lifecycle:

1. The member expresses Inner Sanctum interest.
2. Admin opens the request from `/admin`.
3. Admin enters the required ETH amount and sends a payment invitation.
4. The portal shows a private upgrade alert.
5. The member opens the panel, sees the historical receiving wallet address and ETH amount, sends payment externally, and clicks `Payment Has Been Made`.
6. The transaction moves to `payment_reported`.
7. Admin independently verifies the wallet transfer, optionally records a transaction hash/receipt, and confirms payment.
8. Payment confirmation does not grant access.
9. Admin explicitly grants Inner Sanctum access, which sets `inner_sanctum_access = true` and records who granted it and when.

Transaction statuses:

- `payment_invited`
- `payment_reported`
- `payment_confirmed`
- `access_granted`
- `cancelled`

The receiving wallet address is read from `INNER_SANCTUM_ETH_WALLET_ADDRESS` when admin sends the invitation. The address is stored on the transaction so old payment instructions remain historically stable if configuration changes later. The ETH amount is entered by admin at invitation time and stored as `numeric(30,18)`; the app does not calculate exchange rates.

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

### Admin Membership Workflow Migration

`20260828093420_admin_membership_workflow.sql`

Creates:

- `public.user_entitlements`
- `public.conversations`
- `public.conversation_messages`
- `public.membership_offers`
- `public.inner_sanctum_requests`
- Supporting enum types
- Indexes for admin lists, conversations, offers, and Inner Sanctum requests
- RLS policies for user-owned access and admin-managed access
- `public.current_user_is_admin()`
- `public.accept_membership_offer()`

It also extends the new-user trigger so every new Supabase Auth user receives a default entitlement row with `is_user = true`.

`20260828131818_seed_google_profile_metadata.sql` updates the same new-user trigger so OAuth users can seed a missing profile display name from `display_name`, `full_name`, or `name` metadata without overwriting an existing customized value. Entitlement creation remains idempotent.

### Inner Sanctum Manual Payment Workflow Migration

`20260828104945_inner_sanctum_manual_payment_workflow.sql`

Creates:

- `public.inner_sanctum_transaction_status`
- `public.inner_sanctum_transactions`
- Indexes for user, request, status, and one active transaction per request
- RLS policies allowing users to read only their own transactions and admins to read/manage transaction records
- `public.begin_inner_sanctum_upgrade()`
- `public.report_inner_sanctum_payment()`
- `public.confirm_inner_sanctum_payment()`
- `public.grant_inner_sanctum_access_for_payment()`

The transaction table records:

- user and Inner Sanctum request
- status
- USD value
- required ETH amount
- receiving wallet address
- who sent the invitation
- when the member reported payment
- optional user-supplied hash
- admin-recorded transaction hash/receipt/notes
- who confirmed payment and when
- who granted access and when

The RPC functions are `security definer` functions with explicit `auth.uid()` and admin checks. Direct table writes are not granted to normal users; the public Data API access is read-only and RLS scoped.

Manual admin grant SQL is documented in [ADMIN_SQL.md](ADMIN_SQL.md).

## Environment Variables

Required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
INNER_SANCTUM_ETH_WALLET_ADDRESS=
```

Currently no service role key is needed for the app flow. Admin operations use the signed-in Supabase session plus database-side authorization checks. If a future background job or privileged server-only integration truly needs a service role key, use a non-public variable such as:

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
