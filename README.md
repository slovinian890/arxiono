# Arxiono

Premium marketing site for Arxiono, a mobile app studio — plain HTML, CSS and vanilla JavaScript. No framework, no build step. One small serverless function handles the idea-pitch email.

## Structure

```
index.html        the whole page
css/style.css      all styling
js/main.js         nav behaviour, scroll reveal, form submission
api/submit-idea.js serverless function that emails form submissions via Resend
assets/            logo, favicons, OG image
```

## Run locally

Just open `index.html` in a browser, or serve the folder so the form's fetch call behaves correctly:

```bash
npx serve .
```

The `api/submit-idea.js` function only runs on Vercel (locally or deployed). To test the form end-to-end on your machine:

```bash
npm i -g vercel
vercel dev
```

## Before this goes live

1. **Email sending (required for the idea form to work)**
   - Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day).
   - Copy `.env.local.example` to `.env.local` and paste your API key into `RESEND_API_KEY`.
   - `RESEND_TO_EMAIL` is already set to `sinjurfilip@gmail.com` — change it if submissions should land somewhere else.
   - `RESEND_FROM_EMAIL` defaults to Resend's shared test address (`onboarding@resend.dev`). Once you verify your own domain in Resend, change it to something like `Arxiono <ideas@arxiono.com>`.

2. **Footer contact email** — `index.html` currently links to `hello@arxiono.com` as a placeholder. Update it to a real inbox you check.

3. **Copy review** — the hero, story and services sections are written generically on purpose (no invented stats, team size or client names). Read through and tighten anything that doesn't match reality yet.

4. **Deploy** — this is a static site plus one serverless function, ready for Vercel:
   ```bash
   npm i -g vercel
   vercel
   ```
   Add the three `RESEND_*` env vars in the Vercel dashboard (or `vercel env add`) before going live. Any other static host (Netlify, Cloudflare Pages, GitHub Pages) can serve the site itself — you'd just need to point the form at an equivalent serverless function or a different email provider there.
