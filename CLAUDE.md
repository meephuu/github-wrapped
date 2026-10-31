# GitHub Wrapped

Spotify Wrapped–style year-in-review for GitHub profiles. Next.js 16 (App Router, Turbopack) +
React 19 + TypeScript, no database. Owner: Meephu (Chula Computer Engineering), building it as a
portfolio project. He's on Windows (PowerShell, conda base env); reply in English or Thai, whichever he uses.

## Commands

```bash
npm run dev        # http://localhost:3000
npm test           # vitest: stats engine, GitHub data layer (fetch mocked), session crypto
npm run typecheck  # tsc --noEmit
npm run build      # production build, run before calling something done
```

Run `npm test && npm run typecheck` after every change. Build before finishing a feature.

## Layout

```
app/
  page.tsx                   landing (server: reads session) -> components/Landing.tsx
  sample/page.tsx            demo story with generated data (no network)
  u/[login]/page.tsx         public story; fetch on server, errors redirect to /?error=<code>&detail=...
  u/[login]/og/route.tsx     1200x630 share image (next/og)
  me/page.tsx                signed-in user's own story (private activity)
  auth/login|callback|logout hand-rolled GitHub OAuth (no next-auth)
  api/wrapped/[login]/       JSON API of computed Stats
  globals.css                ALL styling (no Tailwind); colour tokens at the top of :root
components/
  Story.tsx                  story player + every slide (buildSlides) + summary card + PNG export
  Landing.tsx                home page: sign-in block, username form, error display
  Heatmap.tsx, useLang.tsx   contribution calendar; EN/TH toggle (localStorage "gw-lang")
lib/
  github.ts                  data layer. fetchWrapped(login, year, ctx) -> RawWrapped
  compute.ts                 PURE stats engine: RawWrapped -> Stats (streaks, peaks, langs, persona)
  session.ts                 AES-256-GCM encrypted httpOnly cookie "gw_session"
  i18n.ts                    every user-facing string, English + Thai
  sample.ts                  deterministic sample data
  types.ts                   RawWrapped, Stats, etc.
tests/                       vitest
```

## How data flows

1. `lib/github.ts` fetches and normalises into `RawWrapped`, whatever the source:
   - **public mode** (`/u/:login`): GraphQL if `GITHUB_TOKEN` is set, else REST (90 days only).
     If the server token gets a 401 it falls back to REST without a token.
   - **self mode** (`/me`): always GraphQL with the user's OAuth token, `cache: "no-store"`.
2. `compute()` in `lib/compute.ts` turns it into `Stats`. Keep it pure; it runs on the client
   (in Story) so busiest-hour uses the viewer's time zone.
3. `Story.tsx` renders slides from `Stats`.

## Rules to keep

- **Privacy:** public pages must never show private repos. GraphQL is called with
  `privacy: "PUBLIC"` and results are filtered by `isPrivate` unless `ctx.mode === "self" && privateRepos`.
  There are tests for this in `tests/github.test.ts`. Keep them passing.
- Sharing from `/me` copies the public `/u/<login>` URL, never `/me`.
- The OAuth token only lives in the encrypted cookie. Never send it to the client or log it.
- Every new user-facing string goes in `lib/i18n.ts` in **both** `en` and `th`.
- Styling: plain CSS in `app/globals.css` using the tokens in `:root` (`--plum`, `--cobalt`,
  `--saffron`, etc.). Each slide picks a palette in `Story.tsx` (`COLORS`). Single dark look by design.
- Fonts are self-hosted via `@fontsource` (imported in `app/layout.tsx`) because `next/font/google`
  failed to fetch during build. Don't switch back without checking.
- Errors: throw `WrappedError(code, detail)`. Codes: notfound | rate | network | invalid | auth.
  In dev, `detail` is shown under the error on the home page; it's also logged as `[github-wrapped] ...`.

## Env (.env or .env.local; see .env.example)

`GITHUB_TOKEN` (optional server token, no scopes), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
`AUTH_SECRET` (OAuth sign-in), `NEXT_PUBLIC_SITE_URL`. `GITHUB_API_URL` / `GITHUB_URL` override the
GitHub hosts (used to test against a mock server).
OAuth App callback URL for local dev: `http://localhost:3000/auth/callback`.

## Status / open issues (as of 2026-10-31)

- **Not yet verified against real GitHub.** It was built in a sandbox without GitHub access; the OAuth
  flow and every slide were tested against a mock GitHub server and the sample data.
- **"Couldn't reach GitHub" on Meephu's PC (unresolved).** The username lookup failed on his machine.
  The app now logs the real cause; reproduce with `npm run dev`, look for `[github-wrapped]` lines, or run
  `node -e "fetch('https://api.github.com/users/octocat').then(r=>console.log(r.status)).catch(e=>console.log(e.cause||e))"`.
  Suspects: a VPN adapter (his network shows a 26.x.x.x Radmin-style address), a proxy, or a firewall.
- Not a git repo yet. `_to_delete/` holds leftovers from setup and can be deleted.

## Ideas backlog

- Compare two users (`/vs/alice/bob`)
- Animated MP4/GIF export of the whole story
- Multi-year view of how languages changed
- Club/class "team Wrapped"
- GitHub App option for per-repo private access instead of the broad `repo` scope
- Deploy to Vercel (add production callback URL to the OAuth App)
