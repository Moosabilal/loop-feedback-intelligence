import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { Role } from '@prisma/client';
import { ClassificationService } from '@/lib/services/ClassificationService';
import { aiProvider } from '@/lib/container';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Only ADMIN and ANALYST can trigger AI spend
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST]);

    const workspaceId = session!.user.workspaceId;
    const classificationSvc = new ClassificationService(workspaceId, aiProvider);

    // Process a chunk of up to 15 unclassified items
    const result = await classificationSvc.classifyBatch(15);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Batch classification failed:', error);
    const status = error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Batch classification failed' }, { status });
  }
}
