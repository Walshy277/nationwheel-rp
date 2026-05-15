# Nationwheel RP

Nationwheel RP is a React and Supabase web app for geopolitical roleplay boards, nation profiles, dispatches, canon actions, wars, alliances, world news, leaderboards, and admin tools.

## Local Development

Install dependencies:

```powershell
npm install
```

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
VITE_TURNSTILE_SITE_KEY=optional_cloudflare_turnstile_site_key
```

Start the dev server:

```powershell
npm run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Supabase Setup

Run the SQL files from the `supabase/` directory in the Supabase SQL Editor. SQL is intentionally kept out of the frontend bundle.

Recommended order:

```text
supabase/schema.sql
supabase/functions.sql
supabase/migrations/20260513_forum_foundation.sql
supabase/migrations/20260514_scale_forum_limits.sql
supabase/migrations/20260515_admin_profile_forum_tools.sql
supabase/migrations/20260515_moderation_profile_member_tools.sql
supabase/policies.sql
supabase/seed-forum.sql
supabase-nation-seed.sql
```

For admin role repair or first-user promotion, run:

```text
supabase-admin-setup.sql
```

To import the known canon nations from the spreadsheet sources, run:

```text
supabase-nation-seed.sql
```

To add profile avatars, signatures, and bios to an existing database, run:

```text
supabase-profile-setup.sql
```

Supabase Auth CAPTCHA protection applies to sign-up, sign-in, and password reset. The auth form renders Cloudflare Turnstile for both registration and sign-in, and sends the CAPTCHA token to Supabase for each auth request.

To enable multi-nation and alliance wars on an existing database, run:

```text
supabase-war-participants-setup.sql
```

To enable forum reactions, post editing, thread closing, and moderation policies on an existing database, run:

```text
supabase-forum-tools-setup.sql
```

The seed is generated from `-NW- World Database (2).xlsx` and `S2 Base (3).xlsx`. If those sheets are updated, regenerate the SQL with:

```powershell
python scripts/generate_nation_seed.py
```

The frontend must use the Supabase anon or publishable key only. Do not commit service role or secret keys.

## Cloudflare Pages

This app should deploy as a static Vite site on Cloudflare Pages:

```text
Build command: npm run build
Build output directory: dist
Node version: 22
```

Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_TURNSTILE_SITE_KEY` in Cloudflare Pages environment variables before deploying.

The Vite build copies `public/_redirects` into `dist/_redirects` so client-side routes fall back to `index.html` on Cloudflare Pages.

For the free-tier database/storage strategy, read:

```text
docs/free-tier-architecture.md
supabase/migrations/20260514_scale_forum_limits.sql
```

## GitHub Pages Backup Deploy

This repo also includes a GitHub Pages workflow as a secondary static-hosting fallback.

In GitHub:

```text
Settings > Secrets and variables > Actions > New repository secret
```

Add:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_TURNSTILE_SITE_KEY
```

Then enable:

```text
Settings > Pages > Source > GitHub Actions
```

The backup site will publish from the `main` branch workflow.

## Forum And News Formatting

Thread posts and news articles support safe BBCode:

```text
[b]bold[/b]
[i]italic[/i]
[quote]quoted text[/quote]
[url=https://example.com]link text[/url]
[img]https://example.com/image.png[/img]
[color=#f6c132]gold text[/color]
[size=18]larger text[/size]
[hr]
[list]
[*]item
[/list]
```

HTML is escaped by default. Only a very small attribute-free formatting subset is restored, such as `<b>`, `<i>`, `<blockquote>`, and `<code>`.

## Quality Checks

```powershell
npm run lint
npm run format
npm run check
```
