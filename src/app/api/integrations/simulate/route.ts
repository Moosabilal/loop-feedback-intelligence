import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { FeedbackRepository } from '@/lib/repositories/FeedbackRepository';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { CHANNEL_ENUM } from '@/lib/schemas/feedback';

const requestSchema = z.object({
  channel: z.enum(CHANNEL_ENUM, {
    error: 'Invalid channel selected',
  }),
});

const SIMULATION_TEMPLATES = [
  'This is a simulated piece of feedback.',
  'I am having trouble finding the settings menu.',
  'Great experience so far, highly recommended!',
  'The UI is a bit confusing on mobile devices.',
  'Can you add an integration with Slack?',
  'Performance has improved a lot since the last update.',
  'I keep getting logged out randomly.',
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // As explicitly instructed, allow ADMIN and ANALYST
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST]);

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { channel } = parsed.data;
    const workspaceId = session!.user.workspaceId;
    const repo = new FeedbackRepository(workspaceId);

    // Generate 3 random feedback items
    const count = 3;
    const simulatedRows = Array.from({ length: count }).map(() => {
      const randomContent =
        SIMULATION_TEMPLATES[Math.floor(Math.random() * SIMULATION_TEMPLATES.length)];
      return {
        content: `[Simulated] ${randomContent}`,
        channel,
        featureArea: 'Simulated Ingestion',
        createdAt: new Date(),
      };
    });

    await repo.createMany(simulatedRows);

    return NextResponse.json(
      { message: `Successfully simulated ${count} items from ${channel}.` },
      { status: 200 }
    );
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
