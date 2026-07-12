import { TenantScopedRepository } from './TenantScopedRepository';
import prisma from '../prisma';
import { CreateFeedbackInput } from '../schemas/feedback';
import { FeedbackStatus } from '@prisma/client';

export class FeedbackRepository extends TenantScopedRepository {
  /**
   * Creates a new feedback entry scoped to the workspace.
   */
  async create(data: CreateFeedbackInput) {
    return prisma.feedback.create({
      data: {
        content: data.content,
        channel: data.channel,
        status: FeedbackStatus.NEW,
        workspaceId: this.workspaceId,
      },
    });
  }

  /**
   * Retrieves paginated feedback items, optionally filtered by search,
   * and returns both the items and the total count.
   */
  async findMany(skip = 0, take = 50, search?: string) {
    const whereClause = {
      ...this.tenantFilter(),
      ...(search ? { content: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.feedback.count({
        where: whereClause,
      }),
    ]);

    return { items, total };
  }

  /**
   * Updates the status of a specific feedback item, scoping strictly to this workspace.
   */
  async updateStatus(id: string, status: FeedbackStatus) {
    const existing = await prisma.feedback.findFirst({
      where: { id, workspaceId: this.workspaceId },
    });

    if (!existing) {
      throw new Error('Feedback not found or unauthorized.');
    }

    return prisma.feedback.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Bulk creates feedback entries scoped to the workspace.
   */
  async createMany(data: CreateFeedbackInput[]) {
    return prisma.feedback.createMany({
      data: data.map((item) => ({
        content: item.content,
        channel: item.channel,
        status: FeedbackStatus.NEW,
        workspaceId: this.workspaceId,
        featureArea: item.featureArea,
        createdAt: item.createdAt || new Date(),
      })),
    });
  }
}
