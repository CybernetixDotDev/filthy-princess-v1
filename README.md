# Filthy Princess V1

A standalone Next.js retreat landing page and private portal for the Filthy Princess retreat concept.

The public page introduces the world, the retreat journey, the private portal concept, and an enquiry form. Enquiries require private access before they are saved to Supabase, so the confirmed account email becomes the contact identity.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
INNER_SANCTUM_ETH_WALLET_ADDRESS=
```

Do not add a service role key, private wallet key, seed phrase, or recovery phrase to the browser or any `NEXT_PUBLIC_` variable.

## Google OAuth Setup

Enable Google in Supabase Dashboard -> Authentication -> Providers -> Google, then store the Google OAuth client ID and secret there. Do not add Google secrets to this app's environment variables.

Add these app redirect URLs in Supabase Authentication URL Configuration:

```bash
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
https://<your-production-domain>/auth/callback
https://<your-production-domain>/auth/confirm
```

In Google Cloud, use the Supabase project's Google provider callback URL as the authorized redirect URI. The app itself redirects Google sign-in through `/auth/callback`.

## Password Reset Setup

Password reset emails redirect through `/auth/confirm` and then land on `/access/reset-password`. Ensure the local and production `/auth/confirm` URLs above are allowed in Supabase.

## Useful Commands

```bash
npm run lint
npm run build
```

## Documentation

See [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) for the current architecture, user flow, Supabase schema, and next steps.

Manual admin promotion SQL is documented in [docs/ADMIN_SQL.md](docs/ADMIN_SQL.md).
