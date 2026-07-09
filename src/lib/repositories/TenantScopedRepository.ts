export abstract class TenantScopedRepository {
  protected readonly workspaceId: string;

  constructor(workspaceId: string) {
    if (!workspaceId) {
      throw new Error('TenantScopedRepository must be initialized with a workspaceId');
    }
    this.workspaceId = workspaceId;
  }

  /**
   * Utility to always spread the workspaceId into Prisma `where` clauses,
   * guaranteeing that cross-tenant queries cannot accidentally occur.
   */
  protected tenantFilter<T extends object>(where: T = {} as T): T & { workspaceId: string } {
    return {
      ...where,
      workspaceId: this.workspaceId,
    };
  }
}
