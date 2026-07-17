import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AskLoopService } from '@/lib/services/AskLoopService';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow ALL authenticated users (including VIEWER) to use Ask LOOP.
    // So we don't call AuthorizationService.requireRole here.

    const workspaceId = session.user.workspaceId;
    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Invalid question format' }, { status: 400 });
    }

    const askLoopSvc = new AskLoopService(workspaceId);
    const result = await askLoopSvc.askQuestion(question);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Ask LOOP error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
