import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { FeedbackService } from '@/lib/services/FeedbackService';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Any authenticated user can read feedback
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST, Role.VIEWER]);

    const feedbackService = new FeedbackService(session!.user.workspaceId);
    const feedback = await feedbackService.getFeedback();

    return NextResponse.json({ feedback });
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Only Admin and Analyst can create feedback manually
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST]);

    const body = await req.json();
    const feedbackService = new FeedbackService(session!.user.workspaceId);

    const feedback = await feedbackService.createFeedback(body);

    return NextResponse.json(
      { message: 'Feedback created successfully', feedback },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
