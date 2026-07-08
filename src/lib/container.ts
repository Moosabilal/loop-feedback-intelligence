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
