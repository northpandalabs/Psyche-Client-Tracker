import { describe, expect, it } from "vitest";
import { parseVer, semverGt } from "./version";

describe("parseVer", () => {
  it("parses a stable version as max alpha rank", () => {
    const [ma, mi, pa, al] = parseVer("1.2.3");
    expect([ma, mi, pa]).toEqual([1, 2, 3]);
    expect(al).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("parses an alpha version with its counter", () => {
    expect(parseVer("0.1.0a8")).toEqual([0, 1, 0, 8]);
  });

  it("parses double-digit alpha counter", () => {
    expect(parseVer("0.1.0a11")).toEqual([0, 1, 0, 11]);
  });

  it("returns -1 sentinel for malformed input", () => {
    expect(parseVer("bad")).toEqual([-1, -1, -1, -1]);
    expect(parseVer("1.2")).toEqual([-1, -1, -1, -1]);
    expect(parseVer("")).toEqual([-1, -1, -1, -1]);
  });
});

describe("semverGt -- alpha vs alpha", () => {
  it("higher alpha counter is newer", () => expect(semverGt("0.1.0a10", "0.1.0a9")).toBe(true));
  it("same alpha counter is not newer", () => expect(semverGt("0.1.0a3", "0.1.0a3")).toBe(false));
  it("lower alpha counter is not newer", () => expect(semverGt("0.1.0a1", "0.1.0a2")).toBe(false));
  it("double-digit beats single-digit", () => expect(semverGt("0.1.0a10", "0.1.0a9")).toBe(true));
});

describe("semverGt -- stable vs alpha", () => {
  it("stable is newer than any alpha of the same base", () => expect(semverGt("0.1.0", "0.1.0a99")).toBe(true));
  it("alpha is NOT newer than the stable of the same base", () => expect(semverGt("0.1.0a5", "0.1.0")).toBe(false));
  it("stable of the same version is not newer than itself", () => expect(semverGt("0.1.0", "0.1.0")).toBe(false));
});

describe("semverGt -- major / minor / patch", () => {
  it("major bump is newer", () => expect(semverGt("1.0.0", "0.9.9")).toBe(true));
  it("minor bump is newer", () => expect(semverGt("0.2.0", "0.1.9")).toBe(true));
  it("patch bump is newer", () => expect(semverGt("0.1.1", "0.1.0")).toBe(true));
  it("earlier major is not newer", () => expect(semverGt("0.9.9", "1.0.0")).toBe(false));
  it("newer stable beats older alpha across minor", () => expect(semverGt("0.2.0", "0.1.0a5")).toBe(true));
});

describe("parseVer -- edge cases", () => {
  it("parses versions with leading zeros (treated as decimal)", () => {
    // "01.02.03" -- \d+ matches, Number("01") === 1, so same as "1.2.3"
    expect(parseVer("01.02.03")).toEqual([1, 2, 3, Number.MAX_SAFE_INTEGER]);
  });

  it("rejects uppercase A suffix (case-sensitive regex)", () => {
    // "0.1.0A5" does not match (?:a(\d+))? so the full string fails
    expect(parseVer("0.1.0A5")).toEqual([-1, -1, -1, -1]);
  });

  it("rejects version strings with leading whitespace", () => {
    expect(parseVer(" 0.1.0")).toEqual([-1, -1, -1, -1]);
  });

  it("rejects version strings with trailing whitespace", () => {
    expect(parseVer("0.1.0 ")).toEqual([-1, -1, -1, -1]);
  });
});

describe("semverGt -- malformed input", () => {
  it("malformed left side is not newer", () => expect(semverGt("bad", "0.1.0")).toBe(false));
  it("malformed right side is still beaten by valid version", () => expect(semverGt("0.1.0", "bad")).toBe(true));
  it("both malformed is not newer", () => expect(semverGt("bad", "also-bad")).toBe(false));
});
