import { Session } from 'next-auth';
import { Role } from '@prisma/client';

export class AuthorizationService {
  /**
   * Enforces that the current session user has at least one of the required roles.
   * Throws a 403 Forbidden Error if the check fails.
   */
  static requireRole(session: Session | null, allowedRoles: Role[]) {
    if (!session || !session.user) {
      throw new Error('Unauthorized: No active session');
    }

    if (!allowedRoles.includes(session.user.role as Role)) {
      throw new Error('Forbidden: You do not have permission to perform this action');
    }
  }

  /**
   * Safe check for UI rendering - returns true/false instead of throwing.
   */
  static hasRole(session: Session | null, allowedRoles: Role[]): boolean {
    if (!session || !session.user) return false;
    return allowedRoles.includes(session.user.role as Role);
  }
}
