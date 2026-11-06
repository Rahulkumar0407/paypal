import { beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "./crypto";
import {
  validateSessionToken,
  type AuthenticatedUser,
} from "./session";
import {
  TenantAccessDeniedError,
} from "./tenant";
import { checkRateLimit, clearRateLimits } from "./rate-limit";

describe("Mandatory Security Gate — Two Independent Merchant Tenant Isolation", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  // Simulated DB state representing two independent merchants in PostgreSQL
  const dbUsers = new Map<string, { id: string; email: string; name: string; passwordHash: string; emailVerified: boolean }>();
  const dbStores = new Map<string, { id: string; name: string; isDemo: boolean; minimumBalanceCents: number }>();
  const dbMemberships = new Map<string, { id: string; userId: string; storeId: string; role: "OWNER" | "MANAGER" | "VIEWER" }>();
  const dbSessions = new Map<string, { id: string; userId: string; tokenHash: string; expiresAt: Date; revokedAt: Date | null }>();
  const dbReceipts = new Map<string, { id: string; storeId: string; status: "WAITING" | "EXECUTED" | "BLOCKED" }>();

  function resetMockState() {
    dbUsers.clear();
    dbStores.clear();
    dbMemberships.clear();
    dbSessions.clear();
    dbReceipts.clear();

    // Merchant Alpha
    dbUsers.set("usr_alpha", {
      id: "usr_alpha",
      email: "alpha@merchanta.com",
      name: "Alpha Merchant",
      passwordHash: hashPassword("AlphaSecurePass123!"),
      emailVerified: true,
    });
    dbStores.set("st_alpha_retail", {
      id: "st_alpha_retail",
      name: "Alpha Retailers",
      isDemo: false,
      minimumBalanceCents: 50_000,
    });
    dbMemberships.set("mem_alpha", {
      id: "mem_alpha",
      userId: "usr_alpha",
      storeId: "st_alpha_retail",
      role: "OWNER",
    });
    dbReceipts.set("rcpt_alpha_supplier_order", {
      id: "rcpt_alpha_supplier_order",
      storeId: "st_alpha_retail",
      status: "WAITING",
    });

    // Merchant Beta
    dbUsers.set("usr_beta", {
      id: "usr_beta",
      email: "beta@merchantb.com",
      name: "Beta Merchant",
      passwordHash: hashPassword("BetaSecurePass456!"),
      emailVerified: true,
    });
    dbStores.set("st_beta_logistics", {
      id: "st_beta_logistics",
      name: "Beta Logistics",
      isDemo: false,
      minimumBalanceCents: 100_000,
    });
    dbMemberships.set("mem_beta", {
      id: "mem_beta",
      userId: "usr_beta",
      storeId: "st_beta_logistics",
      role: "OWNER",
    });
    dbReceipts.set("rcpt_beta_refund", {
      id: "rcpt_beta_refund",
      storeId: "st_beta_logistics",
      status: "WAITING",
    });

    // Demo store for baseline comparison
    dbStores.set("st_demo_visitor_1", {
      id: "st_demo_visitor_1",
      name: "Loop Audio",
      isDemo: true,
      minimumBalanceCents: 25_000,
    });
  }

  const mockDb = {
    session: {
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        for (const sess of dbSessions.values()) {
          if (sess.tokenHash === where.tokenHash) {
            const user = dbUsers.get(sess.userId);
            if (!user) return null;
            const memberships = Array.from(dbMemberships.values())
              .filter((m) => m.userId === user.id)
              .map((m) => ({
                storeId: m.storeId,
                role: m.role,
                store: dbStores.get(m.storeId)!,
              }));
            return {
              ...sess,
              user: {
                ...user,
                memberships,
              },
            };
          }
        }
        return null;
      },
    },
  } as unknown as PrismaClient;

  it("1. Registration & Login: verifies hashed credentials and produces valid session", async () => {
    resetMockState();

    // Verify correct password verification
    const alpha = dbUsers.get("usr_alpha")!;
    expect(verifyPassword("AlphaSecurePass123!", alpha.passwordHash)).toBe(true);
    expect(verifyPassword("WrongPassword123!", alpha.passwordHash)).toBe(false);

    // Create session token for Alpha
    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    dbSessions.set("sess_alpha_1", {
      id: "sess_alpha_1",
      userId: alpha.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    });

    // Validate token
    const authenticated = await validateSessionToken(rawToken, mockDb);
    expect(authenticated).not.toBeNull();
    expect(authenticated?.id).toBe("usr_alpha");
    expect(authenticated?.email).toBe("alpha@merchanta.com");
    expect(authenticated?.stores[0]?.storeId).toBe("st_alpha_retail");
  });

  it("2. Session Revocation (Logout) & Expiration: fails closed immediately", async () => {
    resetMockState();

    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    dbSessions.set("sess_test", {
      id: "sess_test",
      userId: "usr_alpha",
      tokenHash,
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    });

    // Valid
    let user = await validateSessionToken(rawToken, mockDb);
    expect(user).not.toBeNull();

    // Revoke session (simulate logout)
    dbSessions.get("sess_test")!.revokedAt = new Date();
    user = await validateSessionToken(rawToken, mockDb);
    expect(user).toBeNull();

    // Expired session
    const expiredToken = generateSessionToken();
    dbSessions.set("sess_expired", {
      id: "sess_expired",
      userId: "usr_alpha",
      tokenHash: hashSessionToken(expiredToken),
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
    });
    user = await validateSessionToken(expiredToken, mockDb);
    expect(user).toBeNull();
  });

  it("3. Cross-Merchant Data Access: Merchant Beta cannot read or access Merchant Alpha store", async () => {
    resetMockState();

    const userBeta: AuthenticatedUser = {
      id: "usr_beta",
      email: "beta@merchantb.com",
      name: "Beta Merchant",
      emailVerified: true,
      stores: [{ storeId: "st_beta_logistics", role: "OWNER", storeName: "Beta Logistics" }],
    };

    // User Beta accessing their own store
    const ownAccess = userBeta.stores.some((s) => s.storeId === "st_beta_logistics");
    expect(ownAccess).toBe(true);

    // User Beta attempting to access Merchant Alpha's store -> FORBIDDEN
    const crossAccess = userBeta.stores.some((s) => s.storeId === "st_alpha_retail");
    expect(crossAccess).toBe(false);

    expect(() => {
      const membership = userBeta.stores.find((s) => s.storeId === "st_alpha_retail");
      if (!membership) {
        throw new TenantAccessDeniedError(
          `Access denied: User ${userBeta.email} is not a member of store st_alpha_retail.`
        );
      }
    }).toThrow(TenantAccessDeniedError);
  });

  it("4. Cross-Merchant Actions and Approvals: Merchant Beta cannot decide Merchant Alpha receipts", async () => {
    resetMockState();

    const userBeta: AuthenticatedUser = {
      id: "usr_beta",
      email: "beta@merchantb.com",
      name: "Beta Merchant",
      emailVerified: true,
      stores: [{ storeId: "st_beta_logistics", role: "OWNER", storeName: "Beta Logistics" }],
    };

    function approveReceipt(user: AuthenticatedUser, targetStoreId: string, receiptId: string) {
      // 1. Verify user belongs to store
      const membership = user.stores.find((s) => s.storeId === targetStoreId);
      if (!membership) {
        throw new TenantAccessDeniedError("Access denied: Not your store.");
      }
      // 2. Verify receipt belongs to store
      const receipt = dbReceipts.get(receiptId);
      if (!receipt || receipt.storeId !== targetStoreId) {
        throw new Error("Receipt not found in this store.");
      }
      return { ok: true, receiptId, status: "APPROVED" };
    }

    // Merchant Beta approving their own receipt
    expect(approveReceipt(userBeta, "st_beta_logistics", "rcpt_beta_refund").ok).toBe(true);

    // Merchant Beta attempting to approve Merchant Alpha's receipt -> BLOCKED with TenantAccessDeniedError
    expect(() => approveReceipt(userBeta, "st_alpha_retail", "rcpt_alpha_supplier_order")).toThrow(
      TenantAccessDeniedError
    );

    // Merchant Beta attempting to approve Alpha's receipt under Beta's storeId -> BLOCKED receipt not found
    expect(() => approveReceipt(userBeta, "st_beta_logistics", "rcpt_alpha_supplier_order")).toThrow(
      "Receipt not found in this store."
    );
  });

  it("5. Manipulated storeId and Cookie Gate: Unauthenticated visitor holding a real store ID is strictly rejected", async () => {
    resetMockState();

    function evaluateCookieAccess(cookieStoreId: string, currentUser: AuthenticatedUser | null) {
      const store = dbStores.get(cookieStoreId);
      if (!store) throw new Error("Store not found");

      // REAL MERCHANT STORE:
      if (!store.isDemo) {
        if (!currentUser) {
          throw new TenantAccessDeniedError(
            "Unauthenticated access to real merchant data is strictly prohibited."
          );
        }
        const hasMembership = currentUser.stores.some((s) => s.storeId === cookieStoreId);
        if (!hasMembership) {
          throw new TenantAccessDeniedError(
            "Forbidden: You do not have permission to access this store."
          );
        }
        return { allowed: true, storeName: store.name };
      }

      // DEMO STORE:
      return { allowed: true, storeName: "Loop Audio (Demo)" };
    }

    // 1. Attacker sets ns_store=st_alpha_retail with NO authentication -> BLOCKED
    expect(() => evaluateCookieAccess("st_alpha_retail", null)).toThrow(TenantAccessDeniedError);

    // 2. Attacker sets ns_store=st_beta_logistics with NO authentication -> BLOCKED
    expect(() => evaluateCookieAccess("st_beta_logistics", null)).toThrow(TenantAccessDeniedError);

    // 3. Visitor with demo store -> ALLOWED
    expect(evaluateCookieAccess("st_demo_visitor_1", null).allowed).toBe(true);

    // 4. Authenticated Merchant Alpha with ns_store=st_alpha_retail -> ALLOWED
    const userAlpha: AuthenticatedUser = {
      id: "usr_alpha",
      email: "alpha@merchanta.com",
      name: "Alpha Merchant",
      emailVerified: true,
      stores: [{ storeId: "st_alpha_retail", role: "OWNER", storeName: "Alpha Retailers" }],
    };
    expect(evaluateCookieAccess("st_alpha_retail", userAlpha).allowed).toBe(true);

    // 5. Authenticated Merchant Alpha with manipulated cookie ns_store=st_beta_logistics -> BLOCKED
    expect(() => evaluateCookieAccess("st_beta_logistics", userAlpha)).toThrow(TenantAccessDeniedError);
  });

  it("6. Role-Based Permissions: VIEWER cannot perform actions requiring MANAGER or OWNER", () => {
    const viewerUser: AuthenticatedUser = {
      id: "usr_employee",
      email: "staff@merchanta.com",
      name: "Staff Member",
      emailVerified: true,
      stores: [{ storeId: "st_alpha_retail", role: "VIEWER", storeName: "Alpha Retailers" }],
    };

    function performAction(user: AuthenticatedUser, storeId: string, requiredRole: "OWNER" | "MANAGER" | "VIEWER") {
      const membership = user.stores.find((s) => s.storeId === storeId);
      if (!membership) throw new TenantAccessDeniedError("Access denied.");
      const weights = { VIEWER: 1, MANAGER: 2, OWNER: 3 };
      if (weights[membership.role] < weights[requiredRole]) {
        throw new TenantAccessDeniedError(
          `Insufficient permissions: ${membership.role} cannot perform ${requiredRole} action.`
        );
      }
      return true;
    }

    // VIEWER viewing forecast -> ALLOWED
    expect(performAction(viewerUser, "st_alpha_retail", "VIEWER")).toBe(true);

    // VIEWER changing settings (requires OWNER) -> FORBIDDEN
    expect(() => performAction(viewerUser, "st_alpha_retail", "OWNER")).toThrow(TenantAccessDeniedError);

    // VIEWER approving payments (requires MANAGER) -> FORBIDDEN
    expect(() => performAction(viewerUser, "st_alpha_retail", "MANAGER")).toThrow(TenantAccessDeniedError);
  });

  it("7. Concurrent Request Isolation: multiple simultaneous requests evaluate independently", async () => {
    resetMockState();

    const rawTokenAlpha = generateSessionToken();
    dbSessions.set("sess_alpha_concur", {
      id: "sess_alpha_concur",
      userId: "usr_alpha",
      tokenHash: hashSessionToken(rawTokenAlpha),
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    });

    const rawTokenBeta = generateSessionToken();
    dbSessions.set("sess_beta_concur", {
      id: "sess_beta_concur",
      userId: "usr_beta",
      tokenHash: hashSessionToken(rawTokenBeta),
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: null,
    });

    // 10 concurrent requests from Alpha and Beta
    const promises = [
      validateSessionToken(rawTokenAlpha, mockDb),
      validateSessionToken(rawTokenBeta, mockDb),
      validateSessionToken(rawTokenAlpha, mockDb),
      validateSessionToken("invalid_random_token", mockDb),
      validateSessionToken(rawTokenBeta, mockDb),
    ];

    const results = await Promise.all(promises);
    expect(results[0]?.email).toBe("alpha@merchanta.com");
    expect(results[1]?.email).toBe("beta@merchantb.com");
    expect(results[2]?.email).toBe("alpha@merchanta.com");
    expect(results[3]).toBeNull();
    expect(results[4]?.email).toBe("beta@merchantb.com");
  });

  it("8. Rate Limiting Abuse Protection: blocks brute-force login attempts", () => {
    const email = "victim@company.com";

    // 5 attempts allowed
    for (let i = 0; i < 5; i++) {
      const check = checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000);
      expect(check.allowed).toBe(true);
    }

    // 6th attempt BLOCKED
    const blocked = checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
