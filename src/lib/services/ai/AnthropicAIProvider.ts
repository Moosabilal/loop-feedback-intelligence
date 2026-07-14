import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { IAIProvider } from '../../interfaces/IAIProvider';

export class AnthropicAIProvider implements IAIProvider {
  private client: Anthropic;
  private defaultModel = 'claude-3-haiku-20240307'; // Fast, cheap model for tasks

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'FATAL: ANTHROPIC_API_KEY is missing from environment variables. Cannot initialize AnthropicAIProvider.'
      );
    }

    this.client = new Anthropic({
      apiKey,
    });
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.defaultModel,
      max_tokens: 1024,
      system: systemInstruction,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    if (block.type === 'text') {
      return block.text;
    }
    return '';
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<T> {
    const structuredInstruction = `
${systemInstruction || ''}

CRITICAL: You must output ONLY valid, raw JSON. Do not include any explanations, introductory text, or markdown code blocks (like \`\`\`json). The output must start with '{' or '[' and end with '}' or ']'.
`.trim();

    const attemptGeneration = async (): Promise<T> => {
      const textResponse = await this.generateText(prompt, structuredInstruction);

      // Strip markdown fences if the model still includes them despite instructions
      let cleaned = textResponse.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\\n?/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\\n?/, '');
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.replace(/\\n?```$/, '');
      }

      // Parse and validate
      const parsed = JSON.parse(cleaned);
      return schema.parse(parsed);
    };

    try {
      return await attemptGeneration();
    } catch (error) {
      console.warn('First attempt at structured generation failed. Retrying once...', error);
      // Retry once on failure (either JSON parse error or Zod validation error)
      try {
        return await attemptGeneration();
      } catch (retryError) {
        console.error('Retry also failed for structured generation:', retryError);
        throw new Error('Failed to generate valid structured JSON after retry.');
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // TODO: Implement Voyage AI embeddings in Step 3.4
    // NOTE: You will need a VOYAGE_API_KEY environment variable for this.
    throw new Error(
      'generateEmbedding is currently stubbed and will be implemented in Step 3.4 using Voyage AI.'
    );
  }
}
