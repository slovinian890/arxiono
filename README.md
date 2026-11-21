# Arxiono

Premium marketing site for Arxiono, a mobile app studio — built with Next.js, Tailwind CSS and Framer Motion.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Before this goes live

1. **Email sending (required for the idea form to work)**
   - Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day).
   - Copy `.env.local.example` to `.env.local` and paste your API key into `RESEND_API_KEY`.
   - `RESEND_TO_EMAIL` is already set to `sinjurfilip@gmail.com` — change it if submissions should land somewhere else.
   - `RESEND_FROM_EMAIL` defaults to Resend's shared test address (`onboarding@resend.dev`), which works immediately but looks less professional. Once you verify your own domain in Resend, change it to something like `Arxiono <ideas@arxiono.com>`.

2. **Footer contact email** — `src/components/Footer.tsx` currently links to `hello@arxiono.com` as a placeholder. Update it to a real inbox you check.

3. **Copy review** — the hero, story and services sections are written generically on purpose (no invented stats, team size or client names). Read through and tighten anything that doesn't match reality yet — e.g. team size, years active, or specific platforms you specialize in.

4. **Deploy** — this is a standard Next.js app, ready to deploy on Vercel:
   ```bash
   npm i -g vercel
   vercel
   ```
   Add the three `RESEND_*` env vars in the Vercel dashboard (or `vercel env add`) before going live.

## Structure

- `src/components/` — one component per homepage section (Hero, Manifesto, Craft, Partnership, IdeaForm, Footer).
- `src/app/api/submit-idea/route.ts` — serverless route that emails form submissions via Resend.
- `public/arxiono-mark.png` — your logo, also used to generate `icon.png` / `apple-icon.png` / `og-image.png`.
