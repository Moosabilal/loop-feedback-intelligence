import prisma from '../prisma';
import { IAIProvider } from '../interfaces/IAIProvider';
import { ClassificationSchema } from '../schemas/classification';

export class ClassificationService {
  constructor(
    private workspaceId: string,
    private aiProvider: IAIProvider
  ) {}

  async classifyFeedback(feedbackId: string) {
    // 1. Fetch feedback
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId, workspaceId: this.workspaceId },
    });
    if (!feedback) throw new Error('Feedback not found or unauthorized');

    // 2. Fetch existing themes
    const existingThemes = await prisma.theme.findMany({
      where: { workspaceId: this.workspaceId },
    });
    const themeNames = existingThemes.map((t) => t.name).join(', ');

    // 3. Generate prompt
    const systemInstruction = `
You are an expert product analyst classifying customer feedback.
Analyze the provided feedback text and classify its sentiment, calculate a sentiment score (-1.0 to 1.0), identify the primary feature area, and extract key themes.
Provide a concise, one-line rationale for your classification.

CRITICAL THEME REUSE INSTRUCTION:
Below is a list of themes currently in use for this workspace. 
Whenever possible, you MUST reuse themes from this exact list rather than inventing new synonyms. Only create a new theme if absolutely no existing theme applies.

EXISTING THEMES:
${themeNames || 'None'}
    `.trim();

    // 4. Call AI
    const prompt = `Classify this feedback:\n\n${feedback.content}`;
    const result = await this.aiProvider.generateStructured(
      prompt,
      ClassificationSchema,
      systemInstruction
    );

    // 5. Case-insensitive theme matching & creation
    const finalThemes: {
      id: string;
      name: string;
      workspaceId: string;
      createdAt: Date;
      updatedAt: Date;
    }[] = [];
    for (const themeName of result.themes) {
      const trimmed = themeName.trim();
      const lower = trimmed.toLowerCase();
      let matchedTheme = existingThemes.find((t) => t.name.toLowerCase() === lower);

      if (!matchedTheme) {
        matchedTheme = await prisma.theme.upsert({
          where: { workspaceId_name: { workspaceId: this.workspaceId, name: trimmed } },
          update: {},
          create: { name: trimmed, workspaceId: this.workspaceId },
        });
        existingThemes.push(matchedTheme);
      }
      finalThemes.push(matchedTheme);
    }

    // 6. Update Feedback & Link themes inside a transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing themes for re-classification scenarios
      await tx.feedbackTheme.deleteMany({ where: { feedbackId } });

      await tx.feedback.update({
        where: { id: feedbackId },
        data: {
          sentiment: result.sentiment,
          sentimentScore: result.sentimentScore,
          featureArea: result.featureArea,
          rationale: result.rationale,
        },
      });

      if (finalThemes.length > 0) {
        await tx.feedbackTheme.createMany({
          data: finalThemes.map((t) => ({
            feedbackId,
            themeId: t.id,
            workspaceId: this.workspaceId,
            confidence: 1.0,
          })),
        });
      }
    });

    return result;
  }

  async classifyBatch(limit = 15) {
    const unclassified = await prisma.feedback.findMany({
      where: { workspaceId: this.workspaceId, sentiment: null },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    let classified = 0;
    let failed = 0;

    for (const fb of unclassified) {
      try {
        await this.classifyFeedback(fb.id);
        classified++;
      } catch (err) {
        console.error(`Failed to classify feedback ${fb.id}:`, err);
        failed++;
      }

      // Delay of 1000ms between calls to respect free-tier Gemini rate limits (~15 RPM)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return { classified, failed, total: unclassified.length };
  }
}
