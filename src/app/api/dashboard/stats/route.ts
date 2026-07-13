import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FeedbackService } from '@/lib/services/FeedbackService';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }

    // Admins and Analysts and Viewers can all see the dashboard
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST, Role.VIEWER]);

    const feedbackService = new FeedbackService(session.user.workspaceId);
    const stats = await feedbackService.getDashboardStats();

    // TODO: remove artificial delay before Phase 4 hardening
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
