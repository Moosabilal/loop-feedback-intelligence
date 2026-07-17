import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { Role } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AskLoopService } from '@/lib/services/AskLoopService';

// Allow this endpoint to run for up to 5 minutes to process chunks
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Admins/Analysts can run batch processes
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST]);
    const workspaceId = session.user.workspaceId;

    // Parse request body for `limit`
    let limit = 20;
    try {
      const body = await request.json();
      if (typeof body.limit === 'number') {
        limit = body.limit;
      }
    } catch (e) {
      // Ignore if body is empty or malformed
    }

    const feedbackToEmbed = await prisma.feedback.findMany({
      where: {
        workspaceId,
        embeddings: { none: {} },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    if (feedbackToEmbed.length === 0) {
      return NextResponse.json({
        message: 'No un-embedded feedback remaining in this workspace.',
        processed: 0,
      });
    }

    const askLoopSvc = new AskLoopService(workspaceId);
    let successCount = 0;
    let failureCount = 0;

    for (const item of feedbackToEmbed) {
      try {
        await askLoopSvc.embedFeedbackItem(item.id, item.content);
        successCount++;
        // Space out requests to avoid hitting AI provider rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Failed to embed feedback ${item.id}:`, err);
        failureCount++;
      }
    }

    const remaining = await prisma.feedback.count({
      where: {
        workspaceId,
        embeddings: { none: {} },
      },
    });

    return NextResponse.json({
      message: `Batch complete. Processed ${successCount} successfully, ${failureCount} failed.`,
      processed: successCount,
      failed: failureCount,
      remaining,
    });
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Batch embedding error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
