import { z } from 'zod';
import { Sentiment } from '@prisma/client';

export const ClassificationSchema = z
  .object({
    sentiment: z.nativeEnum(Sentiment),
    sentimentScore: z.number().min(-1).max(1),
    themes: z
      .array(z.string())
      .describe('A list of relevant themes. Reuse existing themes when applicable.'),
    featureArea: z.string().describe('The primary product or feature area mentioned.'),
    rationale: z.string().describe('A one-line explanation of the classification.'),
  })
  .refine(
    (data) => {
      if (data.sentiment === 'POSITIVE' && data.sentimentScore < 0) return false;
      if (data.sentiment === 'NEGATIVE' && data.sentimentScore > 0) return false;
      // If neutral, it should be relatively close to 0, e.g. between -0.4 and 0.4
      if (data.sentiment === 'NEUTRAL' && (data.sentimentScore < -0.4 || data.sentimentScore > 0.4))
        return false;
      return true;
    },
    {
      message:
        'Sentiment and sentimentScore must logically align. POSITIVE requires score >= 0. NEGATIVE requires score <= 0. NEUTRAL requires score between -0.4 and 0.4.',
      path: ['sentimentScore'],
    }
  );

export type ClassificationResult = z.infer<typeof ClassificationSchema>;
