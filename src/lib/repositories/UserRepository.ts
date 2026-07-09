import { TenantScopedRepository } from './TenantScopedRepository';
import prisma from '../prisma';

export class UserRepository extends TenantScopedRepository {
  /**
   * Fetch all members for the scoped workspace.
   */
  async findAllWorkspaceMembers() {
    return prisma.user.findMany({
      where: this.tenantFilter(),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Find a user by email, but still strictly scoped to the workspace.
   */
  async findByEmailInWorkspace(email: string) {
    return prisma.user.findFirst({
      where: this.tenantFilter({ email }),
    });
  }
}
