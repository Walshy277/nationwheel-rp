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

Use the setup guide inside the app to copy the full schema SQL into the Supabase SQL Editor.

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

The seed is generated from `-NW- World Database (2).xlsx` and `S2 Base (3).xlsx`. If those sheets are updated, regenerate the SQL with:

```powershell
python scripts/generate_nation_seed.py
```

The frontend must use the Supabase anon or publishable key only. Do not commit service role or secret keys.

## Netlify

Netlify should use the settings in `netlify.toml`:

```text
Build command: npm run build
Publish directory: dist
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify environment variables before deploying.

## Forum Formatting

Thread posts support safe BBCode:

```text
[b]bold[/b]
[i]italic[/i]
[quote]quoted text[/quote]
[url=https://example.com]link text[/url]
[img]https://example.com/image.png[/img]
```

A small safe HTML subset is also allowed for familiar tags such as `<b>`, `<i>`, `<blockquote>`, `<code>`, and lists. Script tags and arbitrary HTML attributes are escaped.
