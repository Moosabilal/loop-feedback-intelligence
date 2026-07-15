/**
 * Dependency Injection Container
 *
 * Following the Dependency Inversion Principle, this container acts as the central registry
 * for all service and repository instances. High-level modules (e.g., Next.js API routes)
 * should retrieve their dependencies from this container rather than instantiating them directly.
 *
 * Example usage:
 * const feedbackService = container.getFeedbackService();
 */

import { FeedbackRepository } from './repositories/FeedbackRepository';
import { AnthropicAIProvider } from './services/ai/AnthropicAIProvider';
import { GoogleAIProvider } from './services/ai/GoogleAIProvider';
import { IAIProvider } from './interfaces/IAIProvider';

const initializeProvider = (): IAIProvider => {
  const provider = process.env.AI_PROVIDER || 'google'; // Default to google as fallback for now

  if (provider === 'anthropic') {
    return new AnthropicAIProvider();
  } else if (provider === 'google') {
    return new GoogleAIProvider();
  } else {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
  }
};

// A simple manual DI container for shared, stateless server-side singletons
export const aiProvider: IAIProvider = initializeProvider();

class Container {
  // private feedbackRepository: IFeedbackRepository;
  // private feedbackService: FeedbackService;

  constructor() {
    // Initialize repositories
    // this.feedbackRepository = new PrismaFeedbackRepository();
    // Initialize services with injected repositories
    // this.feedbackService = new FeedbackService(this.feedbackRepository);
  }

  // public getFeedbackService() {
  //   return this.feedbackService;
  // }
}

export const container = new Container();
