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
   * Retrieves all feedback items for the workspace, ordered by newest first.
   */
  async findMany(skip = 0, take = 50) {
    return prisma.feedback.findMany({
      where: this.tenantFilter(),
      orderBy: { createdAt: 'desc' },
      skip,
      take,
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
