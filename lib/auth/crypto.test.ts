import { describe, expect, it } from "vitest";
import { generateSessionToken, hashPassword, hashSessionToken, verifyPassword } from "./crypto";

describe("lib/auth/crypto", () => {
  it("hashes password with a random salt and verifies correctly", () => {
    const password = "correct-horse-battery-staple";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    // Salting produces different hashes for identical passwords
    expect(hash1).not.toBe(hash2);
    expect(hash1).toContain("$");

    // Correct password matches
    expect(verifyPassword(password, hash1)).toBe(true);
    expect(verifyPassword(password, hash2)).toBe(true);

    // Incorrect password rejected
    expect(verifyPassword("wrong-password", hash1)).toBe(false);
    expect(verifyPassword("", hash1)).toBe(false);
  });

  it("handles malformed hashes safely without throwing", () => {
    expect(verifyPassword("password", "invalid_format")).toBe(false);
    expect(verifyPassword("password", "")).toBe(false);
    expect(verifyPassword("password", "salt$")).toBe(false);
  });

  it("generates high-entropy session tokens and deterministic hashes", () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);

    const hash1 = hashSessionToken(token1);
    const hash2 = hashSessionToken(token1);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});

