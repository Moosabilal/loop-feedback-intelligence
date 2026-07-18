import { IAIProvider } from '../interfaces/IAIProvider';
import { GoogleAIProvider } from './ai/GoogleAIProvider';
import { AnthropicAIProvider } from './ai/AnthropicAIProvider';
import prisma from '@/lib/prisma';
import { ReportRepository } from '../repositories/ReportRepository';

export class VocReportService {
  private aiProvider: IAIProvider;
  private reportRepo: ReportRepository;
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.aiProvider =
      process.env.AI_PROVIDER === 'google' ? new GoogleAIProvider() : new AnthropicAIProvider();
    this.reportRepo = new ReportRepository(workspaceId);
  }

  async generateReport(dateRangeStart: Date, dateRangeEnd: Date): Promise<string> {
    // 1. Fetch raw volume
    const totalFeedback = await prisma.feedback.count({
      where: {
        workspaceId: this.workspaceId,
        createdAt: { gte: dateRangeStart, lte: dateRangeEnd },
      },
    });

    // Guard against sparse data
    if (totalFeedback < 5) {
      throw new Error(
        'Not enough feedback in this period to generate a meaningful report (minimum 5 required).'
      );
    }

    // 2. Sentiment Breakdown
    const sentimentGroup = await prisma.feedback.groupBy({
      by: ['sentiment'],
      _count: { sentiment: true },
      where: {
        workspaceId: this.workspaceId,
        createdAt: { gte: dateRangeStart, lte: dateRangeEnd },
        sentiment: { not: null },
      },
    });

    const sentimentBreakdown = sentimentGroup.reduce(
      (acc, curr) => {
        if (curr.sentiment) {
          acc[curr.sentiment] = curr._count.sentiment;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // 3. Top Themes
    const themeGroup = await prisma.feedbackTheme.groupBy({
      by: ['themeId'],
      _count: { feedbackId: true },
      where: {
        workspaceId: this.workspaceId,
        feedback: {
          createdAt: { gte: dateRangeStart, lte: dateRangeEnd },
        },
      },
      orderBy: { _count: { feedbackId: 'desc' } },
      take: 5,
    });

    const topThemes = [];
    if (themeGroup.length > 0) {
      const themeIds = themeGroup.map((t) => t.themeId);
      const themes = await prisma.theme.findMany({
        where: { id: { in: themeIds } },
        select: { id: true, name: true },
      });
      const themeMap = new Map(themes.map((t) => [t.id, t.name]));

      for (const t of themeGroup) {
        // Fetch 2-3 recent representative verbatim quotes for this theme in the given date range
        const recentFeedback = await prisma.feedbackTheme.findMany({
          where: {
            workspaceId: this.workspaceId,
            themeId: t.themeId,
            feedback: {
              createdAt: { gte: dateRangeStart, lte: dateRangeEnd },
            },
          },
          include: { feedback: true },
          orderBy: { feedback: { createdAt: 'desc' } },
          take: 3,
        });

        topThemes.push({
          themeName: themeMap.get(t.themeId) || 'Unknown',
          count: t._count.feedbackId,
          recentVerbatimQuotes: recentFeedback.map((f) => f.feedback.content),
        });
      }
    }

    // 4. Construct Stats Block
    const statsBlock = {
      period: {
        start: dateRangeStart.toISOString().split('T')[0],
        end: dateRangeEnd.toISOString().split('T')[0],
      },
      volume: {
        totalFeedback,
        sentimentBreakdown,
      },
      topThemes,
    };

    // 5. Build AI Prompt
    const systemInstruction = `You are an expert product analyst writing a Voice of Customer (VOC) report.
You MUST write the report strictly based on the provided JSON data block.
Do NOT invent any numbers, sentiment shifts, themes, or quotes.
If you include quotes, you MUST reproduce them verbatim from the "recentVerbatimQuotes" array, character for character, without summarizing or paraphrasing them.
Format the output as a professional executive Markdown document. Use headings, bullet points, and clear sections (e.g., Executive Summary, Sentiment Overview, Top Themes & Verbatim Quotes, Recommended Actions based on data).`;

    const prompt = `Here is the data for the requested period:
\`\`\`json
${JSON.stringify(statsBlock, null, 2)}
\`\`\`
Please generate the Voice of Customer report in Markdown.`;

    // 6. Generate text
    const markdownContent = await this.aiProvider.generateText(prompt, systemInstruction);

    // 7. Save to DB
    const reportTitle = `Voice of Customer Report (${statsBlock.period.start} to ${statsBlock.period.end})`;
    const report = await this.reportRepo.create({
      title: reportTitle,
      content: markdownContent,
      dateRangeStart,
      dateRangeEnd,
    });

    return report.id;
  }
}
