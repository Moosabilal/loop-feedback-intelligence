import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FeedbackService } from '@/lib/services/FeedbackService';
import { FeedbackStatus } from '@prisma/client';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.nativeEnum(FeedbackStatus),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const feedbackService = new FeedbackService(session.user.workspaceId);

    // updateFeedbackStatus internally verifies Role.ADMIN or Role.ANALYST
    const updated = await feedbackService.updateFeedbackStatus(
      params.id,
      parsed.data.status,
      session
    );

    return NextResponse.json({ message: 'Status updated', feedback: updated }, { status: 200 });
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
