import type { ActivityEvent, RawWrapped, Repo } from "./types";
import { isValidLogin } from "./login";

export { isValidLogin };

export type ErrorCode = "notfound" | "rate" | "network" | "invalid" | "auth";

export class WrappedError extends Error {
  constructor(
    public code: ErrorCode,
    public detail = "",
  ) {
    super(detail ? `${code}: ${detail}` : code);
  }
}

/**
 * Who is asking.
 * - public: anyone looking at /u/:login. Uses the optional server GITHUB_TOKEN and never returns private repos.
 * - self:   the signed-in user looking at their own story with their own OAuth token.
 */
export type FetchContext =
  | { mode: "public" }
  | { mode: "self"; token: string; privateRepos: boolean };

// Overridable for GitHub Enterprise or local testing.
const API = process.env.GITHUB_API_URL || "https://api.github.com";

type Auth = { token: string | null; cache: "shared" | "none" };

function authFor(ctx: FetchContext): Auth {
  if (ctx.mode === "self") return { token: ctx.token, cache: "none" };
  return { token: process.env.GITHUB_TOKEN?.trim() || null, cache: "shared" };
}

function headers(auth: Auth): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "github-wrapped",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (auth.token) h.Authorization = `Bearer ${auth.token}`;
  return h;
}

function cacheOpts(auth: Auth): RequestInit {
  // Never share responses fetched with a user's own token.
  return auth.cache === "none" ? { cache: "no-store" } : ({ next: { revalidate: 3600 } } as RequestInit);
}

/** Turns a thrown fetch error into something readable, including the low-level cause (DNS, TLS, proxy…). */
function describe(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const cause = (e as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    const code = (cause as Error & { code?: string }).code;
    return `${e.message} → ${code ? code + " " : ""}${cause.message}`;
  }
  return e.message;
}

async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    const detail = describe(e);
    console.error(`[github-wrapped] request to ${url.replace(API, "api.github.com")} failed: ${detail}`);
    throw new WrappedError("network", detail);
  }
}

async function checkStatus(r: Response, what: string) {
  if (r.ok) return;
  const body = await r.text().catch(() => "");
  const msg = `${what} returned HTTP ${r.status}${body ? `: ${body.slice(0, 200)}` : ""}`;
  console.error(`[github-wrapped] ${msg}`);
  if (r.status === 404) throw new WrappedError("notfound", msg);
  if (r.status === 401) throw new WrappedError("auth", msg);
  if (r.status === 429 || (r.status === 403 && r.headers.get("x-ratelimit-remaining") === "0"))
    throw new WrappedError("rate", msg);
  throw new WrappedError("network", msg);
}

async function rest<T>(path: string, auth: Auth): Promise<T> {
  const r = await request(API + path, { headers: headers(auth), ...cacheOpts(auth) });
  await checkStatus(r, `GET ${path}`);
  return r.json() as Promise<T>;
}

async function restPages<T>(path: string, max: number, auth: Auth): Promise<T[]> {
  let out: T[] = [];
  for (let p = 1; p <= max; p++) {
    const sep = path.includes("?") ? "&" : "?";
    const chunk = await rest<T[]>(`${path}${sep}per_page=100&page=${p}`, auth);
    out = out.concat(chunk);
    if (chunk.length < 100) break;
  }
  return out;
}

type RestEvent = { type: string; created_at: string; public?: boolean; payload?: { size?: number; distinct_size?: number } };

async function fetchEvents(login: string, auth: Auth, includePrivate: boolean): Promise<ActivityEvent[]> {
  // /events (not /events/public) includes private events when the token belongs to this user.
  const path = includePrivate ? `/users/${login}/events` : `/users/${login}/events/public`;
  try {
    const ev = await restPages<RestEvent>(path, 3, auth);
    return ev
      .filter((e) => includePrivate || e.public !== false)
      .map((e) => ({
        type: e.type,
        createdAt: e.created_at,
        size: e.type === "PushEvent" ? e.payload?.size || e.payload?.distinct_size || 1 : 1,
      }));
  } catch {
    return [];
  }
}

const QUERY = `
query($login: String!, $from: DateTime!, $to: DateTime!, $privacy: RepositoryPrivacy) {
  user(login: $login) {
    login name avatarUrl createdAt
    followers { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: $privacy, first: 100, orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      nodes {
        name description url stargazerCount forkCount isPrivate
        primaryLanguage { name color }
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } }
      }
    }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      totalPullRequestReviewContributions totalRepositoriesWithContributedCommits restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

// Kept out of QUERY on purpose: if GitHub can't resolve one repo in this list (private, deleted, token can't see it)
// it nulls the whole `user` object, which used to make a real account look like "user not found".
const TOP_REPOS_QUERY = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      commitContributionsByRepository(maxRepositories: 10) {
        repository { nameWithOwner url isPrivate primaryLanguage { name color } }
        contributions { totalCount }
      }
    }
  }
}`;

type GqlUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
  createdAt: string;
  followers: { totalCount: number };
  repositories: {
    totalCount: number;
    nodes: {
      name: string;
      description: string | null;
      url: string;
      stargazerCount: number;
      forkCount: number;
      isPrivate: boolean;
      primaryLanguage: { name: string; color: string | null } | null;
      languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
    }[];
  };
  contributionsCollection: {
    totalCommitContributions: number;
    totalPullRequestContributions: number;
    totalIssueContributions: number;
    totalPullRequestReviewContributions: number;
    totalRepositoriesWithContributedCommits: number;
    restrictedContributionsCount: number;
    contributionCalendar: {
      totalContributions: number;
      weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
    };
  };
};

type GqlTopRepo = {
  repository: { nameWithOwner: string; url: string; isPrivate: boolean; primaryLanguage: { name: string; color: string | null } | null };
  contributions: { totalCount: number };
};

/** Best effort: any problem here just means no "where you committed" list, never a failed story. */
async function fetchTopRepos(login: string, from: string, to: string, auth: Auth): Promise<GqlTopRepo[]> {
  try {
    const r = await request(`${API}/graphql`, {
      method: "POST",
      headers: { ...headers(auth), "Content-Type": "application/json" },
      body: JSON.stringify({ query: TOP_REPOS_QUERY, variables: { login, from, to } }),
      ...cacheOpts(auth),
    });
    const body = (await r.json()) as {
      data?: { user: { contributionsCollection: { commitContributionsByRepository: GqlTopRepo[] } } | null };
      errors?: { message?: string }[];
    };
    const list = body.data?.user?.contributionsCollection.commitContributionsByRepository;
    if (!list) console.warn(`[github-wrapped] top repos unavailable: ${body.errors?.map((e) => e.message).join("; ") || `HTTP ${r.status}`}`);
    return list ?? [];
  } catch (e) {
    console.warn(`[github-wrapped] top repos unavailable: ${describe(e)}`);
    return [];
  }
}

async function fetchGraphql(login: string, year: number, ctx: FetchContext, auth: Auth): Promise<RawWrapped> {
  const showPrivate = ctx.mode === "self" && ctx.privateRepos;
  const from = new Date(Date.UTC(year, 0, 1)).toISOString();
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  const to = (end.getTime() > Date.now() ? new Date() : end).toISOString();
  const r = await request(`${API}/graphql`, {
    method: "POST",
    headers: { ...headers(auth), "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { login, from, to, privacy: showPrivate ? null : "PUBLIC" } }),
    ...cacheOpts(auth),
  });
  await checkStatus(r, "GraphQL");
  const body = (await r.json()) as { data?: { user: GqlUser | null }; errors?: { type?: string; message?: string }[] };
  if (!body.data?.user) {
    if (body.data?.user === null || body.errors?.some((e) => e.type === "NOT_FOUND")) throw new WrappedError("notfound");
    const detail = body.errors?.map((e) => e.message).join("; ") || "empty GraphQL response";
    console.error(`[github-wrapped] GraphQL error: ${detail}`);
    throw new WrappedError("network", detail);
  }
  // GitHub answers 200 with the user plus an error for any single node the token can't resolve (a private or
  // deleted repo, say). That is not "user not found": log it and use what came back.
  if (body.errors?.length) console.warn(`[github-wrapped] GraphQL partial errors: ${body.errors.map((e) => e.message).join("; ")}`);
  const u = body.data.user;
  const c = u.contributionsCollection;
  const [events, topRepos] = await Promise.all([fetchEvents(login, auth, showPrivate), fetchTopRepos(login, from, to, auth)]);
  const keep = (isPrivate: boolean) => showPrivate || !isPrivate;

  return {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
    followers: u.followers.totalCount,
    repoCount: u.repositories.totalCount,
    year,
    repos: u.repositories.nodes
      .filter((n) => keep(n.isPrivate))
      .map((n) => ({
        name: n.name,
        description: n.description,
        url: n.url,
        stars: n.stargazerCount,
        forks: n.forkCount,
        language: n.primaryLanguage?.name ?? null,
        languageColor: n.primaryLanguage?.color ?? null,
        languages: n.languages.edges.map((e) => ({ name: e.node.name, color: e.node.color, size: e.size })),
        private: n.isPrivate,
      })),
    calendar: c.contributionCalendar.weeks.flatMap((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
    ),
    totals: {
      total: c.contributionCalendar.totalContributions,
      commits: c.totalCommitContributions,
      prs: c.totalPullRequestContributions,
      issues: c.totalIssueContributions,
      reviews: c.totalPullRequestReviewContributions,
      reposContributed: c.totalRepositoriesWithContributedCommits,
      privateCount: c.restrictedContributionsCount,
    },
    topContribRepos: topRepos
      .filter((x) => keep(x.repository.isPrivate))
      .slice(0, 5)
      .map((x) => ({
        name: x.repository.nameWithOwner,
        url: x.repository.url,
        language: x.repository.primaryLanguage?.name ?? null,
        color: x.repository.primaryLanguage?.color ?? null,
        commits: x.contributions.totalCount,
        private: x.repository.isPrivate,
      })),
    events,
    source: "graphql",
    viewer: ctx.mode === "self",
    includesPrivate: ctx.mode === "self",
    privateRepoDetails: showPrivate,
  };
}

type RestUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  created_at: string;
  followers: number;
  public_repos: number;
};
type RestRepo = {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  fork: boolean;
  private?: boolean;
};

async function fetchRest(login: string, year: number, auth: Auth): Promise<RawWrapped> {
  const u = await rest<RestUser>(`/users/${login}`, auth);
  const [repos, events] = await Promise.all([
    restPages<RestRepo>(`/users/${login}/repos?sort=pushed&type=owner`, 3, auth),
    fetchEvents(login, auth, false),
  ]);
  const own: Repo[] = repos
    .filter((r) => !r.fork && !r.private)
    .map((r) => ({
      name: r.name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      languageColor: null,
      languages: [],
    }));
  return {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatar_url,
    createdAt: u.created_at,
    followers: u.followers,
    repoCount: u.public_repos,
    year,
    repos: own,
    calendar: null,
    totals: null,
    topContribRepos: [],
    events,
    source: "rest",
    viewer: false,
    includesPrivate: false,
  };
}

/**
 * Loads everything the story needs.
 * Public pages use GraphQL when the server has a GITHUB_TOKEN and fall back to the REST API without one
 * (or when that token is rejected). Signed-in users always use their own token.
 */
export async function fetchWrapped(login: string, year: number, ctx: FetchContext = { mode: "public" }): Promise<RawWrapped> {
  if (!isValidLogin(login)) throw new WrappedError("invalid");
  const auth = authFor(ctx);
  if (ctx.mode === "self") return fetchGraphql(login, year, ctx, auth);
  if (auth.token) {
    try {
      return await fetchGraphql(login, year, ctx, auth);
    } catch (e) {
      if (!(e instanceof WrappedError) || e.code !== "auth") throw e;
      console.warn("[github-wrapped] GITHUB_TOKEN was rejected by GitHub (expired or mistyped?). Falling back to the public API.");
      return fetchRest(login, year, { token: null, cache: "shared" });
    }
  }
  return fetchRest(login, year, auth);
}

/** Who owns this token. Used right after sign-in. */
export async function fetchViewer(token: string) {
  const auth: Auth = { token, cache: "none" };
  const r = await request(`${API}/user`, { headers: headers(auth), cache: "no-store" });
  await checkStatus(r, "GET /user");
  const u = (await r.json()) as RestUser;
  return { login: u.login, name: u.name, avatarUrl: u.avatar_url, scopes: r.headers.get("x-oauth-scopes") ?? "" };
}
