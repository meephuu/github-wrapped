# GitHub Wrapped

Your year on GitHub, told as a Spotify Wrapped–style story. Enter any username and tap through
contributions, a full-year heatmap, your longest streak, peak month, coding rhythm, top languages,
favourite repos and a dev personality. It ends on a summary card you can save as an image.

Built with Next.js (App Router), React and TypeScript. No database and no client-side API keys.

## Features

- **Story player**: auto-advancing slides with progress bars. Tap left or right to move, hold to pause, or use the arrow keys, Space and Esc.
- **Full-year data via GraphQL**: the contribution calendar, commits, PRs, reviews and issues, language share by bytes, and the repos you committed to most.
- **Works without a token**: falls back to the public REST API (last 90 days of activity, languages by repo count).
- **Time-zone aware**: busiest hour is calculated in the viewer's own time zone.
- **Dev personality**: nine archetypes (Night Owl, Streak Machine, Polyglot, Reviewer…), each scored from 0 to 1, with a runner-up.
- **English and Thai** UI toggle, remembered per browser. `?lang=th` also works.
- **Sharing**: `/u/<login>?year=2026` links, an auto-generated 1200×630 preview image for social posts, and PNG export of the summary card.
- **JSON API**: `GET /api/wrapped/<login>?year=2026&tz=Asia/Bangkok` returns the computed stats.
- **Sign in with GitHub** (optional): `/me` shows your own story including private contributions.
  Tick "include private repo names" to also see private repos and their languages. Only you can see them,
  and shared links always point at the public version.
- **Sample story** at `/sample` so you can demo it with no network.

## Run it

```bash
npm install
copy .env.example .env.local   # Windows (cp on macOS/Linux), then fill it in, see below
npm run dev                    # http://localhost:3000
```

Everything in `.env.local` is optional. With nothing set, the app works but only shows the last 90 days.

### 1. Server token (full year for public pages)

GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → generate one
with **no scopes ticked**. Paste it as `GITHUB_TOKEN`. It raises the rate limit from 60 to 5,000 requests per hour.

### 2. Sign in with GitHub (private activity)

1. Go to <https://github.com/settings/developers> → **OAuth Apps** → **New OAuth App**.
2. Homepage URL: `http://localhost:3000`. Authorization callback URL: `http://localhost:3000/auth/callback`.
3. Copy the **Client ID** into `GITHUB_CLIENT_ID`, generate a client secret and paste it into `GITHUB_CLIENT_SECRET`.
4. Make a random `AUTH_SECRET`:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
5. Restart `npm run dev`. A **Sign in with GitHub** button appears on the home page.

The access token is kept in an encrypted, httpOnly cookie (AES-256-GCM). It never reaches browser
JavaScript, and nothing is stored in a database. **Sign out** deletes the cookie.

| Sign-in option | GitHub permission | What you see on `/me` |
| --- | --- | --- |
| Default | `read:user` | Full-year totals and heatmap including private contributions |
| "Include private repo names" ticked | `read:user repo` | The above, plus private repo names, languages and push times |

## Troubleshooting

- **"Couldn't reach GitHub"**: the exact reason is printed in the terminal running `npm run dev`
  (lines starting with `[github-wrapped]`), and in dev it's also shown under the error message.
  - `ENOTFOUND`, `ETIMEDOUT` or `ECONNRESET`: Node can't reach api.github.com. Check VPNs (e.g. Radmin), a proxy, or the firewall.
  - `HTTP 401`: `GITHUB_TOKEN` is wrong or expired. The app falls back to the public API, but fix or remove the token.
  - Quick check: `node -e "fetch('https://api.github.com/users/octocat').then(r=>console.log(r.status)).catch(e=>console.log(e.cause||e))"`
- **"not a valid Win32 application" on `npm run dev`**: the install was cut off. Delete `node_modules` and run `npm install` again.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests: stats engine, GitHub data layer (mocked), session encryption |
| `npm run typecheck` | TypeScript check |
| `npm run build && npm start` | Production build |

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo on vercel.com.
3. Add the environment variables from `.env.example`, with `NEXT_PUBLIC_SITE_URL` set to your Vercel URL.
4. In your GitHub OAuth App, add the production callback URL `https://<your-app>.vercel.app/auth/callback`
   (or create a second OAuth App for production).
4. Deploy.

## How it's built

```
app/
  page.tsx                 landing page (username + year)
  sample/page.tsx          demo story with generated data
  u/[login]/page.tsx       fetches data on the server, renders the story
  u/[login]/og/route.tsx   1200×630 share image (next/og)
  me/page.tsx              signed-in user's own story (private activity)
  auth/login|callback|logout  GitHub OAuth flow
  api/wrapped/[login]/     JSON API
components/
  Story.tsx                story player and every slide
  Heatmap.tsx              contribution calendar
  Landing.tsx, useLang.tsx landing form and EN/TH toggle
lib/
  github.ts                GraphQL (with token) or REST fallback, normalised into one shape; public vs signed-in mode
  session.ts               encrypted cookie session
  compute.ts               pure stats engine: streaks, peaks, languages, persona scoring
  i18n.ts                  English and Thai copy
  sample.ts                deterministic sample data
tests/compute.test.ts      stats engine tests
```

The data layer always returns the same `RawWrapped` shape whatever the source, so `compute()`
stays a pure function that is easy to test. Responses are cached for an hour with Next's fetch cache.

## Ideas for what's next

- Compare two users side by side (`/vs/alice/bob`)
- Animated MP4/GIF export of the whole story
- Multi-year view showing how your languages changed over time
- Organisation or team Wrapped for a club or class
- A GitHub App option, so users can grant read access to just the repos they pick
