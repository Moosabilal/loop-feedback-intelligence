import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { CreateFeedbackInput, createFeedbackSchema } from '../schemas/feedback';

export class FeedbackService {
  constructor(private readonly workspaceId: string) {}

  /**
   * Validates the payload and creates a new feedback entry.
   */
  async createFeedback(input: CreateFeedbackInput) {
    const parsed = createFeedbackSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }

    const repo = new FeedbackRepository(this.workspaceId);
    return repo.create(parsed.data);
  }

  /**
   * Retrieves all feedback for the current workspace.
   */
  async getFeedback(skip = 0, take = 50) {
    const repo = new FeedbackRepository(this.workspaceId);
    return repo.findMany(skip, take);
  }
}
