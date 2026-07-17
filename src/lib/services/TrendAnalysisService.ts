import 'server-only';
import prisma from '../prisma';

export interface TrendingTheme {
  themeId: string;
  name: string;
  currentCount: number;
  previousCount: number;
  percentageGrowth: number | null;
  isNew: boolean;
}

export class TrendAnalysisService {
  /**
   * Detects trending themes by comparing feedback volume in the current period vs the previous period.
   * Handles edge cases like new themes that appeared only in the current period.
   *
   * @param workspaceId The tenant ID
   * @param daysPerPeriod Number of days for each period (default 7 days)
   * @param topN How many top trending themes to return (default 5)
   */
  async getTrendingThemes(
    workspaceId: string,
    daysPerPeriod: number = 7,
    topN: number = 5
  ): Promise<TrendingTheme[]> {
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - daysPerPeriod * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(
      currentPeriodStart.getTime() - daysPerPeriod * 24 * 60 * 60 * 1000
    );

    // 1. Fetch FeedbackTheme counts for current period
    const currentFeedbackThemes = await prisma.feedbackTheme.groupBy({
      by: ['themeId'],
      _count: { feedbackId: true },
      where: {
        workspaceId,
        feedback: {
          createdAt: { gte: currentPeriodStart, lte: now },
        },
      },
    });

    // 2. Fetch FeedbackTheme counts for previous period
    const previousFeedbackThemes = await prisma.feedbackTheme.groupBy({
      by: ['themeId'],
      _count: { feedbackId: true },
      where: {
        workspaceId,
        feedback: {
          createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
        },
      },
    });

    // 3. Map counts by themeId
    const currentCounts = new Map<string, number>();
    for (const item of currentFeedbackThemes) {
      currentCounts.set(item.themeId, item._count.feedbackId);
    }

    const previousCounts = new Map<string, number>();
    for (const item of previousFeedbackThemes) {
      previousCounts.set(item.themeId, item._count.feedbackId);
    }

    // 4. Fetch actual theme names for any theme we have data for
    const allThemeIds = Array.from(
      new Set(Array.from(currentCounts.keys()).concat(Array.from(previousCounts.keys())))
    );
    if (allThemeIds.length === 0) return [];

    const themes = await prisma.theme.findMany({
      where: { id: { in: allThemeIds } },
      select: { id: true, name: true },
    });

    const themeNameMap = new Map<string, string>();
    for (const theme of themes) {
      themeNameMap.set(theme.id, theme.name);
    }

    // 5. Calculate growth and build results
    const results: TrendingTheme[] = [];

    for (const themeId of allThemeIds) {
      const current = currentCounts.get(themeId) || 0;
      const previous = previousCounts.get(themeId) || 0;
      const name = themeNameMap.get(themeId) || 'Unknown Theme';

      // We only care about themes that have SOME presence in the current period to be "trending"
      if (current === 0) continue;

      let percentageGrowth: number | null = null;
      let isNew = false;

      if (previous === 0) {
        // Edge Case: Theme exists in current period but had 0 occurrences in previous period.
        // It's a brand new spike. We mark it as `isNew` rather than Infinity growth.
        isNew = true;
      } else {
        percentageGrowth = ((current - previous) / previous) * 100;
      }

      results.push({
        themeId,
        name,
        currentCount: current,
        previousCount: previous,
        percentageGrowth,
        isNew,
      });
    }

    // 6. Sort results
    // We want to sort by highest positive trajectory.
    // We can prioritize:
    // 1. Highest percentage growth (for existing themes)
    // 2. New themes (treat them as highly trending if they have volume)
    // Let's create a custom sort score.
    // For sorting, let's treat "new" themes as having a very high percentage (e.g. 9999%)
    // multiplied by their volume to ensure high-volume new themes rise to the top.

    results.sort((a, b) => {
      const getScore = (t: TrendingTheme) => {
        if (t.isNew) return 1000 + t.currentCount * 10; // New themes get a base boost + volume weight
        return t.percentageGrowth || 0;
      };
      return getScore(b) - getScore(a);
    });

    return results.slice(0, topN);
  }
}
