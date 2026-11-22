# Arxiono

Premium marketing site for Arxiono, a mobile app studio — plain HTML, CSS and vanilla JavaScript. No framework, no build step. One small serverless function handles the idea-pitch email.

## Structure

```
index.html             the marketing page
community.html          the community board feed (sign up, post, vote, comment, follow)
project.html            a single project: full post, votes, comments, progress updates
profile.html            a maker's profile: avatar/bio, followers/following, their projects
css/style.css           shared styling
css/community.css       community-board styling (feed, project cards, updates, modal lists)
css/profile.css         profile-page-only styling (header, stats, projects grid)
js/main.js              nav behaviour, scroll reveal, idea-form submission
js/auth.js              shared Supabase session, login/signup modal, nav auth widget
js/feed-shared.js       helpers shared by community.js/project.js/profile.js (avatars, voting, toasts)
js/community.js         community feed logic: new posts, combined projects+updates feed
js/project.js           single-project page: voting, comments, posting/deleting progress updates
js/profile.js           profile page: stats, follow/unfollow, followers/following lists, edit profile
js/supabase-config.js   your Supabase project URL + anon key go here
supabase/schema.sql     database schema + Row Level Security policies
api/submit-idea.js      serverless function that emails form submissions via Resend
assets/                 logo, favicons, OG image
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

3. **Community board setup**
   - Create a free project at [supabase.com](https://supabase.com).
   - In the SQL Editor, paste and run the entire contents of `supabase/schema.sql` once. It creates the tables (including `project_updates` for progress posts), a trigger that gives every new signup a profile, Row Level Security policies, and public `project-images` + `avatars` storage buckets.
   - **Already have this project set up from before?** The schema file is safe to re-run in full — every statement is `create if not exists` / `drop + recreate policy`, so re-pasting the whole file picks up the `contact` column, the `project_updates` table and the `avatars` bucket without touching existing data.
   - In Settings → API, copy the **Project URL** and the **anon / publishable key** into `js/supabase-config.js`. The anon key is meant to be public — RLS is what actually secures the data.
   - Row Level Security is what stops any visitor from editing someone else's post, vote, or comment, even though the browser talks to Supabase directly with no server in between. Don't disable it.
   - By default Supabase requires email confirmation before a new account can log in — that's intentional and the UI already tells people to check their inbox.

4. **Copy review** — the hero, story and services sections are written generically on purpose (no invented stats, team size or client names). Read through and tighten anything that doesn't match reality yet.

5. **Domain** — SEO needs a real URL. `index.html` and `community.html` (canonical link, Open Graph/Twitter tags, JSON-LD) plus `robots.txt` and `sitemap.xml` all currently point at `https://arxiono.com/` as a placeholder. Once you know your real domain, find-and-replace `arxiono.com` everywhere in those files, and update `lastmod` in `sitemap.xml` whenever a page meaningfully changes.

6. **Deploy** — this is a static site plus one serverless function, ready for Vercel:
   ```bash
   npm i -g vercel
   vercel
   ```
   Add the three `RESEND_*` env vars in the Vercel dashboard (or `vercel env add`) before going live. The community board needs no server-side env vars at all — it's pure static files once `js/supabase-config.js` has your real values. Any other static host (Netlify, Cloudflare Pages, GitHub Pages) can serve the whole site as-is; you'd only need an equivalent serverless function elsewhere for the idea-pitch email.

7. **Search Console** — once live on the real domain, add the site to [Google Search Console](https://search.google.com/search-console) and submit `https://yourdomain.com/sitemap.xml` so it gets indexed quickly.

## SEO

Already in place: a descriptive title/meta description, canonical URL, Open Graph + Twitter card tags (with a proper 1200×630 image), `ProfessionalService` JSON-LD structured data, `robots.txt`, `sitemap.xml`, a single `<h1>` with a clean heading hierarchy below it, descriptive `alt` text on meaningful images (decorative ones are left empty on purpose), and content that's fully visible even with JavaScript disabled (the scroll-reveal animation only activates once a tiny inline script confirms JS actually ran). The one thing you need to do is swap the placeholder domain for your real one — see "Domain" above.
