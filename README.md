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

## Useful Commands

```bash
npm run lint
npm run build
```

## Documentation

See [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) for the current architecture, user flow, Supabase schema, and next steps.

Manual admin promotion SQL is documented in [docs/ADMIN_SQL.md](docs/ADMIN_SQL.md).
