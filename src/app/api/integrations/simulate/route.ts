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

const FRAGMENTS = {
  subjects: [
    'The new dashboard',
    'The UI',
    'The mobile app',
    'Customer support',
    'Pricing',
    'The checkout process',
    'Onboarding',
    'The search feature',
    'Exporting reports',
  ],
  verbs: ['is', 'feels', 'looks', 'seems', 'functions', 'runs', 'operates'],
  adjectives: [
    'incredible',
    'confusing',
    'fast',
    'slow',
    'intuitive',
    'buggy',
    'steep',
    'smooth',
    'clunky',
    'fantastic',
    'broken',
  ],
  suffixes: [
    'these days.',
    'since the last update.',
    'on Android.',
    'for small teams.',
    'overall.',
    'which is frustrating.',
    'which is amazing.',
    'compared to competitors.',
  ],
};

type ChannelType = (typeof CHANNEL_ENUM)[number];

function generateUniqueFeedback(count: number, channel: ChannelType) {
  const generated = new Set<string>();
  const rows = [];

  while (rows.length < count) {
    const subject = FRAGMENTS.subjects[Math.floor(Math.random() * FRAGMENTS.subjects.length)];
    const verb = FRAGMENTS.verbs[Math.floor(Math.random() * FRAGMENTS.verbs.length)];
    const adjective = FRAGMENTS.adjectives[Math.floor(Math.random() * FRAGMENTS.adjectives.length)];
    const suffix = FRAGMENTS.suffixes[Math.floor(Math.random() * FRAGMENTS.suffixes.length)];

    const content = `[Simulated] ${subject} ${verb} ${adjective} ${suffix}`;

    if (!generated.has(content)) {
      generated.add(content);
      rows.push({
        content,
        channel,
        featureArea: 'Simulated Ingestion',
        createdAt: new Date(),
      });
    }
  }

  return rows;
}

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

    // Generate 3 random, unique feedback items
    const count = 3;
    const simulatedRows = generateUniqueFeedback(count, channel);

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
