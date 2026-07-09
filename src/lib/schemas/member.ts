import { z } from 'zod';
import { Role } from '@prisma/client';

export const inviteMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(Role, {
    message: 'Invalid role selected',
  }),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
