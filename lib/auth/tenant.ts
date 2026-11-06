import { redirect } from "next/navigation";
import { getCurrentUser, type AuthenticatedUser } from "./session";

export class TenantAccessDeniedError extends Error {
  constructor(message = "You do not have authorization to access this store's financial data.") {
    super(message);
    this.name = "TenantAccessDeniedError";
  }
}

/**
 * Enforces that a user is signed in. Redirects to /login if unauthenticated.
 */
export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Validates that the signed-in user is authorized to view or mutate data for `storeId`.
 * Throws TenantAccessDeniedError (403 Forbidden) on cross-tenant access attempts.
 */
export async function requireStoreAccess(
  storeId: string,
  requiredRole: "OWNER" | "MANAGER" | "VIEWER" = "VIEWER"
): Promise<{ user: AuthenticatedUser; role: "OWNER" | "MANAGER" | "VIEWER" }> {
  const user = await requireAuthenticatedUser();
  const membership = user.stores.find((s) => s.storeId === storeId);

  if (!membership) {
    throw new TenantAccessDeniedError(
      `Access denied: User ${user.email} is not a member of store ${storeId}.`
    );
  }

  const roleWeights: Record<string, number> = {
    VIEWER: 1,
    MANAGER: 2,
    OWNER: 3,
  };

  if ((roleWeights[membership.role] ?? 0) < (roleWeights[requiredRole] ?? 0)) {
    throw new TenantAccessDeniedError(
      `Insufficient permissions: ${membership.role} cannot perform actions requiring ${requiredRole}.`
    );
  }

  return { user, role: membership.role };
}

/**
 * Returns the active storeId for the authenticated user, or their primary store.
 */
export async function getAuthorizedStoreId(): Promise<string> {
  const user = await requireAuthenticatedUser();
  const primary = user.stores[0]?.storeId;
  if (!primary) {
    redirect("/onboarding");
  }
  return primary;
}
