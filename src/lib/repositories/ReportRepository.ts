import prisma from '@/lib/prisma';
import { TenantScopedRepository } from './TenantScopedRepository';

export interface CreateReportInput {
  title: string;
  content: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
}

export class ReportRepository extends TenantScopedRepository {
  async create(data: CreateReportInput) {
    return prisma.report.create({
      data: {
        title: data.title,
        content: data.content,
        dateRangeStart: data.dateRangeStart,
        dateRangeEnd: data.dateRangeEnd,
        workspaceId: this.workspaceId,
      },
    });
  }

  async findMany() {
    return prisma.report.findMany({
      where: this.tenantFilter(),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        dateRangeStart: true,
        dateRangeEnd: true,
        createdAt: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.report.findUnique({
      where: {
        id,
        workspaceId: this.workspaceId,
      },
    });
  }

  async delete(id: string) {
    return prisma.report.delete({
      where: {
        id,
        workspaceId: this.workspaceId,
      },
    });
  }
}
