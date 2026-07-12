import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { FeedbackService } from '@/lib/services/FeedbackService';
import { Role } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    // Hardcoded maximum limit of 100 to prevent abuse
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || undefined;

    const skip = (page - 1) * limit;

    const feedbackService = new FeedbackService(session.user.workspaceId);
    const result = await feedbackService.getFeedback(skip, limit, search);

    return NextResponse.json(
      {
        feedback: result.items,
        meta: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      },
      { status: 200 }
    );
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
