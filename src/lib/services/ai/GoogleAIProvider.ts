import 'server-only';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { z } from 'zod';
import { IAIProvider } from '../../interfaces/IAIProvider';

/**
 * TEMPORARY SUBSTITUTE PROVIDER
 * This provider uses the Google Gemini API to temporarily unblock Phase 3 development
 * while waiting for the official Anthropic API key to be provisioned.
 * Once the Anthropic key is available, switch AI_PROVIDER=anthropic in the environment
 * to seamlessly return to the original implementation.
 */

// Global rate limiter state to ensure max 15 RPM (1 request every 4 seconds)
// This is shared across all instances in this Node process.
let lastCallTime = 0;
const MIN_INTERVAL_MS = 4100; // 4.1 seconds to be safe

async function enforceRateLimit() {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  if (timeSinceLastCall < MIN_INTERVAL_MS) {
    const delay = MIN_INTERVAL_MS - timeSinceLastCall;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastCallTime = Date.now();
}

export class GoogleAIProvider implements IAIProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private embeddingModel: GenerativeModel;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'FATAL: GOOGLE_AI_API_KEY is missing from environment variables. Cannot initialize GoogleAIProvider.'
      );
    }

    this.client = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.1-flash-lite because its free tier offers 500 requests/day and 15 RPM
    // (a 25x improvement over standard Flash's 20 requests/day limit).
    // This provides sufficient daily quota headroom for testing and backfilling
    // during the temporary Anthropic-key-pending period.
    this.model = this.client.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    this.embeddingModel = this.client.getGenerativeModel({ model: 'gemini-embedding-2' });
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    await enforceRateLimit();

    const modelInstance = systemInstruction
      ? this.client.getGenerativeModel({ model: 'gemini-3.1-flash-lite', systemInstruction })
      : this.model;

    const result = await modelInstance.generateContent(prompt);
    return result.response.text();
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
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseError: any) {
        console.error('JSON Parse Error. Raw response was:', textResponse);
        throw new Error(
          `JSON Parse Error: ${parseError.message}\n\nRAW_AI_RESPONSE:\n${textResponse}`
        );
      }

      try {
        return schema.parse(parsed);
      } catch (zodError: any) {
        console.error('Zod Validation Error. Raw response was:', textResponse);
        throw new Error(
          `Zod Validation Error: ${zodError.message}\n\nRAW_AI_RESPONSE:\n${textResponse}`
        );
      }
    };

    try {
      return await attemptGeneration();
    } catch (error) {
      console.warn('First attempt at structured generation failed. Retrying once...', error);
      // Retry once on failure
      try {
        return await attemptGeneration();
      } catch (retryError) {
        console.error('Retry also failed for structured generation:', retryError);
        throw new Error('Failed to generate valid structured JSON after retry.');
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    await enforceRateLimit();
    const result = await this.embeddingModel.embedContent(text);
    return result.embedding.values;
  }
}
