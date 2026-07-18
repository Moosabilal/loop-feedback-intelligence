import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { VocReportService } from '@/lib/services/VocReportService';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }

    // Only Admin and Analyst can generate reports
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST]);

    const body = await request.json();
    const { dateRangeStart, dateRangeEnd } = body;

    if (!dateRangeStart || !dateRangeEnd) {
      return NextResponse.json(
        { error: 'Missing dateRangeStart or dateRangeEnd' },
        { status: 400 }
      );
    }

    const start = new Date(dateRangeStart);
    const end = new Date(dateRangeEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const vocService = new VocReportService(session.user.workspaceId);
    const reportId = await vocService.generateReport(start, end);

    return NextResponse.json({ reportId }, { status: 200 });
  } catch (error: any) {
    const status = error.message.includes('Forbidden')
      ? 403
      : error.message.includes('Not enough feedback')
        ? 400
        : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
