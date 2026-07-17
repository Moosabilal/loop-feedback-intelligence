import { FeedbackRepository } from '../repositories/FeedbackRepository';
import { CreateFeedbackInput, createFeedbackSchema } from '../schemas/feedback';
import { Role, FeedbackStatus } from '@prisma/client';
import { AuthorizationService } from '../services/AuthorizationService';

import { ClassificationService } from './ClassificationService';
import { aiProvider } from '../container';

export class FeedbackService {
  constructor(private readonly workspaceId: string) {}

  /**
   * Validates the payload, creates a new feedback entry, and auto-classifies it.
   */
  async createFeedback(input: CreateFeedbackInput) {
    const parsed = createFeedbackSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }

    const repo = new FeedbackRepository(this.workspaceId);
    const feedback = await repo.create(parsed.data);

    // Auto-classify and embed on ingestion
    try {
      const classificationSvc = new ClassificationService(this.workspaceId, aiProvider);
      await classificationSvc.classifyFeedback(feedback.id);

      const { AskLoopService } = require('./AskLoopService');
      const askLoopSvc = new AskLoopService(this.workspaceId);
      await askLoopSvc.embedFeedbackItem(feedback.id, feedback.content);
    } catch (err) {
      console.error('Failed to auto-classify or embed new feedback:', err);
      // We don't fail the creation if classification fails. It stays unclassified (flagged for review).
    }

    return feedback;
  }

  /**
   * Retrieves paginated feedback for the current workspace.
   */
  async getFeedback(skip = 0, take = 50, search?: string, theme?: string) {
    const repo = new FeedbackRepository(this.workspaceId);
    return repo.findMany(skip, take, search, theme);
  }

  /**
   * Updates a feedback's status, ensuring the user has triage privileges.
   */
  async updateFeedbackStatus(id: string, status: FeedbackStatus, session: any) {
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST]);
    const repo = new FeedbackRepository(this.workspaceId);
    return repo.updateStatus(id, status);
  }

  /**
   * Retrieves dashboard statistics and chart data.
   */
  async getDashboardStats() {
    const repo = new FeedbackRepository(this.workspaceId);
    return repo.getDashboardStats();
  }

  /**
   * Bulk creates feedback entries, validating each row and returning a summary.
   */
  async bulkCreateFeedback(rows: any[]) {
    const validRows: CreateFeedbackInput[] = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const parsed = createFeedbackSchema.safeParse(row);
      if (parsed.success) {
        validRows.push(parsed.data);
      } else {
        const issues = parsed.error.issues.map((i) => i.message).join(', ');
        errors.push(`Row ${index + 1}: ${issues}`);
      }
    });

    if (validRows.length > 0) {
      const repo = new FeedbackRepository(this.workspaceId);
      await repo.createMany(validRows);
    }

    return {
      successCount: validRows.length,
      failureCount: errors.length,
      errors,
    };
  }
}
