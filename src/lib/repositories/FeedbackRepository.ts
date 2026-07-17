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
  async findMany(skip = 0, take = 50, search?: string, themeName?: string) {
    const whereClause: any = {
      ...this.tenantFilter(),
      ...(search ? { content: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    if (themeName) {
      whereClause.themes = {
        some: {
          theme: { name: themeName },
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          themes: {
            include: { theme: true },
          },
        },
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

  async getDashboardStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalFeedback,
      newThisWeek,
      recentFeedback,
      totalClassified,
      negativeCount,
      sentimentGroup,
      themeGroup,
    ] = await Promise.all([
      prisma.feedback.count({ where: this.tenantFilter() }),
      prisma.feedback.count({
        where: {
          ...this.tenantFilter(),
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      // Fetch the last 14 days of data to group by date in JS
      prisma.feedback.findMany({
        where: {
          ...this.tenantFilter(),
          createdAt: { gte: fourteenDaysAgo },
        },
        select: { createdAt: true },
      }),
      // Count total classified
      prisma.feedback.count({
        where: { ...this.tenantFilter(), sentiment: { not: null } },
      }),
      // Count negative sentiment
      prisma.feedback.count({
        where: { ...this.tenantFilter(), sentiment: 'NEGATIVE' },
      }),
      // Group sentiment
      prisma.feedback.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
        where: { ...this.tenantFilter(), sentiment: { not: null } },
      }),
      // Group themes
      prisma.feedbackTheme.groupBy({
        by: ['themeId'],
        _count: { feedbackId: true },
        where: { workspaceId: this.workspaceId },
        orderBy: { _count: { feedbackId: 'desc' } },
        take: 5,
      }),
    ]);

    // Group by date string (YYYY-MM-DD)
    const volumeMap = new Map<string, number>();
    // Pre-fill last 14 days so we have 0s where appropriate
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      volumeMap.set(d.toISOString().split('T')[0], 0);
    }

    recentFeedback.forEach((fb) => {
      const dateStr = fb.createdAt.toISOString().split('T')[0];
      if (volumeMap.has(dateStr)) {
        volumeMap.set(dateStr, volumeMap.get(dateStr)! + 1);
      }
    });

    const volume = Array.from(volumeMap.entries()).map(([date, count]) => ({ date, count }));

    // Map sentiment
    const sentiment = sentimentGroup.map((s) => ({
      name: s.sentiment as string,
      count: s._count.sentiment,
    }));

    // Map themes
    const themeIds = themeGroup.map((t) => t.themeId);
    let themes: { name: string; count: number }[] = [];
    if (themeIds.length > 0) {
      const themeNames = await prisma.theme.findMany({
        where: { id: { in: themeIds } },
        select: { id: true, name: true },
      });
      const themeMap = new Map(themeNames.map((t) => [t.id, t.name]));
      themes = themeGroup.map((t) => ({
        name: themeMap.get(t.themeId) || 'Unknown',
        count: t._count.feedbackId,
      }));
    }

    const pctNegative = totalClassified > 0 ? (negativeCount / totalClassified) * 100 : 0;

    return {
      stats: {
        totalFeedback,
        newThisWeek,
        pctNegative: Math.round(pctNegative * 10) / 10,
      },
      volume,
      sentiment,
      themes,
    };
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
