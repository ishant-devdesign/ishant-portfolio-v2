# Ishant Portfolio

Dark editorial portfolio scaffold built with **Next.js** for **Vercel** deployment.

## Current implementation status
This implementation currently includes:
- Next.js App Router project scaffold
- dark editorial visual shell
- top navigation + side navigation foundation
- custom branded intro loader
- desktop custom cursor with contextual labels
- home page narrative layout
- projects, blogs, certifications, pets, auth, and 404 routes
- detailed mock content for testing structure and rhythm
- Supabase schema draft and environment placeholders
- Supabase auth foundation
  - browser/server clients
  - middleware session refresh
  - magic-link auth page
  - callback route
  - sign-out route
  - allowed-admin check helper

## Run locally
```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Environment
Create a `.env.local` file from `.env.example` when Supabase credentials are ready.

## Included planning docs
- `../notes/portfolio-planning.md`
- `../notes/portfolio-architecture-spec.md`

## Next implementation priorities
1. Supabase client wiring
2. Auth + allowed admin checks
3. Inline admin mode
4. Media upload system
5. Gutenberg-like block editor
6. Draft/publish workflow
