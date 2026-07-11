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
    error: 'Invalid channel selected',
  }),
  createdAt: z
    .union([z.string(), z.date()])
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  featureArea: z.string().optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
