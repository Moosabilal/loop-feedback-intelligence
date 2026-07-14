import { z } from 'zod';

export interface IAIProvider {
  /**
   * Generates a structured JSON response strictly adhering to the provided Zod schema.
   * If parsing fails, the provider will attempt to retry before throwing.
   */
  generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    systemInstruction?: string
  ): Promise<T>;

  /**
   * Generates a conversational text response.
   */
  generateText(prompt: string, systemInstruction?: string): Promise<string>;

  /**
   * Generates a vector embedding array for the given text.
   */
  generateEmbedding(text: string): Promise<number[]>;
}
