import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { FeedbackService } from '@/lib/services/FeedbackService';
import { Role } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Only Admin and Analyst can upload bulk feedback
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST]);

    const body = await req.json();

    if (!Array.isArray(body.rows)) {
      return NextResponse.json({ error: 'Payload must include a "rows" array.' }, { status: 400 });
    }

    const feedbackService = new FeedbackService(session!.user.workspaceId);

    const summary = await feedbackService.bulkCreateFeedback(body.rows);

    return NextResponse.json({ message: 'Bulk upload processed', summary }, { status: 200 });
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
