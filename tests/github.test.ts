import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWrapped, WrappedError } from "@/lib/github";

const user = {
  login: "meephu",
  name: "Meephu",
  avatarUrl: "a",
  createdAt: "2024-01-01T00:00:00Z",
  followers: { totalCount: 3 },
  repositories: {
    totalCount: 2,
    nodes: [
      { name: "public-app", description: null, url: "u1", stargazerCount: 5, forkCount: 0, isPrivate: false, primaryLanguage: { name: "Go", color: "#0ad" }, languages: { edges: [] } },
      { name: "secret-app", description: null, url: "u2", stargazerCount: 0, forkCount: 0, isPrivate: true, primaryLanguage: { name: "Rust", color: "#dea" }, languages: { edges: [] } },
    ],
  },
  contributionsCollection: {
    totalCommitContributions: 10, totalPullRequestContributions: 1, totalIssueContributions: 0,
    totalPullRequestReviewContributions: 0, totalRepositoriesWithContributedCommits: 2, restrictedContributionsCount: 4,
    contributionCalendar: { totalContributions: 11, weeks: [{ contributionDays: [{ date: "2026-01-01", contributionCount: 11 }] }] },
    commitContributionsByRepository: [
      { repository: { nameWithOwner: "meephu/secret-app", url: "u2", isPrivate: true, primaryLanguage: null }, contributions: { totalCount: 7 } },
      { repository: { nameWithOwner: "meephu/public-app", url: "u1", isPrivate: false, primaryLanguage: null }, contributions: { totalCount: 3 } },
    ],
  },
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

let calls: { url: string; init?: RequestInit }[] = [];

beforeEach(() => {
  calls = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return handler(url, init);
  }));
}

describe("fetchWrapped", () => {
  it("hides private repos on public pages even if the server token can see them", async () => {
    vi.stubEnv("GITHUB_TOKEN", "server-token");
    mockFetch((url, init) => {
      if (url.endsWith("/graphql")) {
        expect(JSON.parse(init!.body as string).variables.privacy).toBe("PUBLIC");
        return json({ data: { user } });
      }
      return json([]);
    });
    const raw = await fetchWrapped("meephu", 2026);
    expect(raw.repos.map((r) => r.name)).toEqual(["public-app"]);
    expect(raw.topContribRepos.map((r) => r.name)).toEqual(["meephu/public-app"]);
    expect(raw.viewer).toBe(false);
    expect(calls.some((c) => c.url.includes("/events/public"))).toBe(true);
  });

  it("shows private repos to the signed-in owner and never caches their requests", async () => {
    mockFetch((url) => (url.endsWith("/graphql") ? json({ data: { user } }) : json([])));
    const raw = await fetchWrapped("meephu", 2026, { mode: "self", token: "user-token", privateRepos: true });
    expect(raw.repos.map((r) => r.name)).toEqual(["public-app", "secret-app"]);
    expect(raw.topContribRepos[0]).toMatchObject({ name: "meephu/secret-app", private: true });
    expect(raw).toMatchObject({ viewer: true, includesPrivate: true });
    for (const c of calls) {
      expect((c.init?.headers as Record<string, string>).Authorization).toBe("Bearer user-token");
      expect(c.init?.cache).toBe("no-store");
    }
    expect(calls.some((c) => c.url.match(/\/events\?/))).toBe(true);
  });

  it("keeps private repo names hidden when the user only granted read:user", async () => {
    mockFetch((url) => (url.endsWith("/graphql") ? json({ data: { user } }) : json([])));
    const raw = await fetchWrapped("meephu", 2026, { mode: "self", token: "t", privateRepos: false });
    expect(raw.repos.map((r) => r.name)).toEqual(["public-app"]);
    expect(raw.totals?.total).toBe(11);
  });

  it("falls back to the public API when the server token is rejected", async () => {
    vi.stubEnv("GITHUB_TOKEN", "expired");
    mockFetch((url) => {
      if (url.endsWith("/graphql")) return json({ message: "Bad credentials" }, 401);
      if (url.endsWith("/users/meephu"))
        return json({ login: "meephu", name: null, avatar_url: "a", created_at: "2024-01-01T00:00:00Z", followers: 0, public_repos: 1 });
      return json([]);
    });
    const raw = await fetchWrapped("meephu", 2026);
    expect(raw.source).toBe("rest");
    const fallback = calls.find((c) => c.url.endsWith("/users/meephu"))!;
    expect((fallback.init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("reports the low-level cause when the network fails", async () => {
    mockFetch(() => {
      throw Object.assign(new TypeError("fetch failed"), { cause: Object.assign(new Error("getaddrinfo ENOTFOUND api.github.com"), { code: "ENOTFOUND" }) });
    });
    const err = await fetchWrapped("meephu", 2026).catch((e) => e);
    expect(err).toBeInstanceOf(WrappedError);
    expect(err.code).toBe("network");
    expect(err.detail).toContain("ENOTFOUND");
  });

  it("uses the user data when GitHub also reports a NOT_FOUND for one inaccessible repo", async () => {
    vi.stubEnv("GITHUB_TOKEN", "server-token");
    const partial = { type: "NOT_FOUND", message: "Could not resolve to a Repository with the name 'meephu/gone'." };
    mockFetch((url) => (url.endsWith("/graphql") ? json({ data: { user }, errors: [partial] }) : json([])));
    const raw = await fetchWrapped("meephu", 2026);
    expect(raw.source).toBe("graphql");
    expect(raw.repos.map((r) => r.name)).toEqual(["public-app"]);
  });

  it("still reports notfound when GraphQL has no such user", async () => {
    vi.stubEnv("GITHUB_TOKEN", "server-token");
    mockFetch(() => json({ data: { user: null }, errors: [{ type: "NOT_FOUND", message: "Could not resolve to a User with the login of 'nobody'." }] }));
    expect((await fetchWrapped("nobody", 2026).catch((e) => e)).code).toBe("notfound");
  });

  it("maps 404 and rate limits", async () => {
    mockFetch(() => json({ message: "Not Found" }, 404));
    expect((await fetchWrapped("nobody", 2026).catch((e) => e)).code).toBe("notfound");
    mockFetch(() => new Response("{}", { status: 403, headers: { "x-ratelimit-remaining": "0" } }));
    expect((await fetchWrapped("meephu", 2026).catch((e) => e)).code).toBe("rate");
  });
});
