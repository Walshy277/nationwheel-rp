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

The frontend must use the Supabase anon or publishable key only. Do not commit service role or secret keys.
