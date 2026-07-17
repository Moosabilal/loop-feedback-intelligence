import { IAIProvider } from '../interfaces/IAIProvider';
import { GoogleAIProvider } from './ai/GoogleAIProvider';
import { AnthropicAIProvider } from './ai/AnthropicAIProvider';
import { EmbeddingRepository } from '../repositories/EmbeddingRepository';
import { FeedbackRepository } from '../repositories/FeedbackRepository';

export class AskLoopService {
  private aiProvider: IAIProvider;
  private embeddingRepo: EmbeddingRepository;
  private feedbackRepo: FeedbackRepository;

  constructor(workspaceId: string) {
    this.aiProvider =
      process.env.AI_PROVIDER === 'google' ? new GoogleAIProvider() : new AnthropicAIProvider();

    this.embeddingRepo = new EmbeddingRepository(workspaceId);
    this.feedbackRepo = new FeedbackRepository(workspaceId);
  }

  /**
   * Generates and upserts an embedding for a given feedback item.
   */
  async embedFeedbackItem(feedbackId: string, content: string): Promise<void> {
    const vector = await this.aiProvider.generateEmbedding(content);
    await this.embeddingRepo.upsertFeedbackEmbedding(feedbackId, vector);
  }

  /**
   * RAG pipeline: embeds the question, finds similar feedback, and generates a grounded response.
   */
  async askQuestion(question: string): Promise<{ answer: string; sources: any[] }> {
    // 1. Embed the question
    const queryVector = await this.aiProvider.generateEmbedding(question);

    // 2. Retrieve similar feedback
    const contextItems = await this.embeddingRepo.searchSimilarFeedback(queryVector, 10);

    if (contextItems.length === 0) {
      return {
        answer: "I couldn't find any feedback in this workspace to answer your question.",
        sources: [],
      };
    }

    // 3. Format the context
    const contextString = contextItems
      .map((item, i) => {
        const themes = item.themes.length > 0 ? `Themes: ${item.themes.join(', ')}` : 'No Themes';
        const sentiment = item.sentiment ? `Sentiment: ${item.sentiment}` : 'Unclassified';
        return `[Source ${i + 1}] (${sentiment} | ${themes}): "${item.content}"`;
      })
      .join('\n\n');

    // 4. Generate grounded response
    const systemPrompt = `You are an expert customer feedback analyst named LOOP. 
Your primary task is to answer the user's question based strictly on the provided customer feedback items.

CRITICAL RULES:
1. ONLY use the provided context to formulate your answer.
2. NEVER invent, hallucinate, or reference feedback that is not explicitly present in the provided context.
3. If the context does not contain enough information to answer the question, explicitly state: "I don't have enough information in the provided feedback to answer that."
4. Use citations in your response (e.g., "[Source 1]", "[Source 3]") to show where your insights come from.
5. Provide clear, concise, and helpful analysis.

<context>
${contextString}
</context>`;

    const responseText = await this.aiProvider.generateText(question, systemPrompt);

    return {
      answer: responseText,
      sources: contextItems,
    };
  }
}
