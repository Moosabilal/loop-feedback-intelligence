import prisma from '@/lib/prisma';
import { TenantScopedRepository } from './TenantScopedRepository';

export interface SimilarFeedbackResult {
  id: string;
  content: string;
  sentiment: string | null;
  themes: string[];
  distance: number;
}

export class EmbeddingRepository extends TenantScopedRepository {
  /**
   * Upsert an embedding for a specific feedback item.
   * Uses Prisma $executeRaw to handle the pgvector Unsupported type.
   */
  async upsertFeedbackEmbedding(feedbackId: string, vector: number[]): Promise<void> {
    const vectorString = `[${vector.join(',')}]`;

    // There is no updatedAt on Embedding right now.
    await prisma.$executeRaw`
      INSERT INTO "Embedding" (id, vector, "feedbackId", "workspaceId", "createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${vectorString}::vector,
        ${feedbackId},
        ${this.workspaceId},
        NOW()
      )
      ON CONFLICT ("feedbackId") 
      DO UPDATE SET 
        vector = EXCLUDED.vector;
    `;
  }

  /**
   * Search for feedback items similar to the given query vector.
   * Strictly scopes the search to the current tenant (workspaceId).
   */
  async searchSimilarFeedback(
    queryVector: number[],
    limit: number = 10
  ): Promise<SimilarFeedbackResult[]> {
    const vectorString = `[${queryVector.join(',')}]`;

    // Perform cosine distance search (<=>)
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        f.id,
        f.content,
        f.sentiment,
        e.vector <=> ${vectorString}::vector as distance
      FROM "Embedding" e
      JOIN "Feedback" f ON e."feedbackId" = f.id
      WHERE e."workspaceId" = ${this.workspaceId}
      ORDER BY distance ASC
      LIMIT ${limit};
    `;

    // Fetch themes for the retrieved feedback items to enrich the RAG context
    const feedbackIds = results.map((r) => r.id);

    if (feedbackIds.length === 0) return [];

    const themesMap = new Map<string, string[]>();
    const feedbackThemes = await prisma.feedbackTheme.findMany({
      where: {
        feedbackId: { in: feedbackIds },
        workspaceId: this.workspaceId,
      },
      include: { theme: true },
    });

    for (const ft of feedbackThemes) {
      if (!themesMap.has(ft.feedbackId)) {
        themesMap.set(ft.feedbackId, []);
      }
      themesMap.get(ft.feedbackId)!.push(ft.theme.name);
    }

    return results.map((row) => ({
      id: row.id,
      content: row.content,
      sentiment: row.sentiment,
      distance: row.distance,
      themes: themesMap.get(row.id) || [],
    }));
  }

  /**
   * Count total embeddings for the current workspace.
   */
  async countEmbeddings(): Promise<number> {
    return prisma.embedding.count({
      where: {
        workspaceId: this.workspaceId,
      }
    });
  }
}
