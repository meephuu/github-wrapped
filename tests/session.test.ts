import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

import { seal, unseal } from "@/lib/session";

beforeEach(() => vi.stubEnv("AUTH_SECRET", "test-secret-that-is-long-enough-123"));
afterEach(() => vi.unstubAllEnvs());

describe("session cookie", () => {
  it("round-trips data", () => {
    const v = seal({ token: "gho_abc", login: "meephu" });
    expect(v).not.toContain("gho_abc");
    expect(unseal(v)).toEqual({ token: "gho_abc", login: "meephu" });
  });
  it("rejects tampered cookies", () => {
    const v = seal({ login: "meephu" });
    const tampered = v.slice(0, -2) + (v.endsWith("A") ? "BB" : "AA");
    expect(unseal(tampered)).toBeNull();
    expect(unseal("garbage")).toBeNull();
    expect(unseal(undefined)).toBeNull();
  });
  it("can't be read with a different secret", () => {
    const v = seal({ login: "meephu" });
    vi.stubEnv("AUTH_SECRET", "a-completely-different-secret-456");
    expect(unseal(v)).toBeNull();
  });
});
