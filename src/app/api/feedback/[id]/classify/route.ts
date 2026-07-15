import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { Role } from '@prisma/client';
import { ClassificationService } from '@/lib/services/ClassificationService';
import { aiProvider } from '@/lib/container';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    // Only ADMIN and ANALYST can trigger AI spend
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST]);

    const workspaceId = session!.user.workspaceId;
    const classificationSvc = new ClassificationService(workspaceId, aiProvider);

    const result = await classificationSvc.classifyFeedback(params.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Manual classification failed:', error);
    const status = error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Classification failed' }, { status });
  }
}
