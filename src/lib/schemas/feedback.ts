import { z } from 'zod';

export const CHANNEL_ENUM = [
  'Email',
  'In-App',
  'Support Ticket',
  'Social Media',
  'App Store',
] as const;

export const createFeedbackSchema = z.object({
  content: z.string().min(10, 'Feedback content must be at least 10 characters long.'),
  channel: z.enum(CHANNEL_ENUM, {
    message: 'Invalid channel selected',
  }),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
