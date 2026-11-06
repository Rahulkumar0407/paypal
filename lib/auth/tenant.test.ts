import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { TenantAccessDeniedError } from "./tenant";
import { validateSessionToken, type AuthenticatedUser } from "./session";
import { hashSessionToken } from "./crypto";

describe("Multi-tenant isolation and authorization", () => {
  it("enforces tenant boundary: user cannot access unowned store", () => {
    const userA: AuthenticatedUser = {
      id: "usr_alice",
      email: "alice@acme.com",
      name: "Alice",
      emailVerified: true,
      stores: [{ storeId: "st_acme_audio", role: "OWNER", storeName: "Acme Audio" }],
    };

    const userB: AuthenticatedUser = {
      id: "usr_bob",
      email: "bob@beta.com",
      name: "Bob",
      emailVerified: true,
      stores: [{ storeId: "st_beta_parts", role: "OWNER", storeName: "Beta Parts" }],
    };

    function checkAccess(
      user: AuthenticatedUser,
      targetStoreId: string,
      requiredRole: "OWNER" | "MANAGER" | "VIEWER" = "VIEWER"
    ) {
      const membership = user.stores.find((s) => s.storeId === targetStoreId);
      if (!membership) {
        throw new TenantAccessDeniedError(
          `Access denied: User ${user.email} is not a member of store ${targetStoreId}.`
        );
      }
      const weights = { VIEWER: 1, MANAGER: 2, OWNER: 3 };
      if (weights[membership.role] < weights[requiredRole]) {
        throw new TenantAccessDeniedError("Insufficient permissions.");
      }
      return true;
    }

    // User A can access their own store
    expect(checkAccess(userA, "st_acme_audio")).toBe(true);

    // User B can access their own store
    expect(checkAccess(userB, "st_beta_parts")).toBe(true);

    // Cross-tenant access attempt: User A accessing User B's store MUST FAIL with TenantAccessDeniedError
    expect(() => checkAccess(userA, "st_beta_parts")).toThrow(TenantAccessDeniedError);

    // Cross-tenant access attempt: User B accessing User A's store MUST FAIL with TenantAccessDeniedError
    expect(() => checkAccess(userB, "st_acme_audio")).toThrow(TenantAccessDeniedError);
  });

  it("enforces role-based hierarchy within a store", () => {
    const viewerUser: AuthenticatedUser = {
      id: "usr_charlie",
      email: "charlie@acme.com",
      name: "Charlie",
      emailVerified: true,
      stores: [{ storeId: "st_acme_audio", role: "VIEWER", storeName: "Acme Audio" }],
    };

    function checkRole(user: AuthenticatedUser, storeId: string, required: "OWNER" | "MANAGER" | "VIEWER") {
      const m = user.stores.find((s) => s.storeId === storeId);
      if (!m) throw new TenantAccessDeniedError();
      const weights = { VIEWER: 1, MANAGER: 2, OWNER: 3 };
      if (weights[m.role] < weights[required]) throw new TenantAccessDeniedError("Insufficient permissions.");
      return true;
    }

    // VIEWER can view
    expect(checkRole(viewerUser, "st_acme_audio", "VIEWER")).toBe(true);

    // VIEWER cannot perform OWNER or MANAGER actions
    expect(() => checkRole(viewerUser, "st_acme_audio", "MANAGER")).toThrow(TenantAccessDeniedError);
    expect(() => checkRole(viewerUser, "st_acme_audio", "OWNER")).toThrow(TenantAccessDeniedError);
  });

  it("validates session tokens and rejects expired or revoked sessions", async () => {
    const activeToken = "valid_token_12345";
    const expiredToken = "expired_token_12345";
    const revokedToken = "revoked_token_12345";

    const mockDb = {
      session: {
        findUnique: async ({ where }: { where: { tokenHash: string } }) => {
          if (where.tokenHash === hashSessionToken(activeToken)) {
            return {
              id: "sess_1",
              userId: "usr_alice",
              revokedAt: null,
              expiresAt: new Date(Date.now() + 86400000), // tomorrow
              user: {
                id: "usr_alice",
                email: "alice@acme.com",
                name: "Alice",
                emailVerified: true,
                memberships: [{ storeId: "st_acme", role: "OWNER" as const, store: { id: "st_acme", name: "Acme" } }],
              },
            };
          }
          if (where.tokenHash === hashSessionToken(expiredToken)) {
            return {
              id: "sess_2",
              userId: "usr_alice",
              revokedAt: null,
              expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
              user: { id: "usr_alice", email: "alice@acme.com", name: "Alice", emailVerified: true, memberships: [] },
            };
          }
          if (where.tokenHash === hashSessionToken(revokedToken)) {
            return {
              id: "sess_3",
              userId: "usr_alice",
              revokedAt: new Date(Date.now() - 1000), // revoked
              expiresAt: new Date(Date.now() + 86400000),
              user: { id: "usr_alice", email: "alice@acme.com", name: "Alice", emailVerified: true, memberships: [] },
            };
          }
          return null;
        },
      },
    } as unknown as PrismaClient;

    const activeUser = await validateSessionToken(activeToken, mockDb);
    expect(activeUser).not.toBeNull();
    expect(activeUser?.email).toBe("alice@acme.com");

    const expiredUser = await validateSessionToken(expiredToken, mockDb);
    expect(expiredUser).toBeNull();

    const revokedUser = await validateSessionToken(revokedToken, mockDb);
    expect(revokedUser).toBeNull();
  });
});
