import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthorizationService } from '@/lib/services/AuthorizationService';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { AuthService } from '@/lib/services/AuthService';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Any authenticated user can view the member list
    AuthorizationService.requireRole(session, [Role.ADMIN, Role.ANALYST, Role.VIEWER]);

    const userRepo = new UserRepository(session!.user.workspaceId);
    const members = await userRepo.findAllWorkspaceMembers();

    return NextResponse.json({ members });
  } catch (error: any) {
    // Return 401 if unauthorized, 403 if forbidden
    const status = error.message.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Server-side enforcement: ONLY Admins can invite new members
    AuthorizationService.requireRole(session, [Role.ADMIN]);

    const body = await req.json();
    const authService = new AuthService();

    // This will auto-generate the 'loop123' password and assign it
    const { user, defaultPassword } = await authService.inviteMember(
      body,
      session!.user.workspaceId
    );

    return NextResponse.json(
      { message: 'Member invited successfully', member: user, defaultPassword },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 401;
    return NextResponse.json({ error: error.message }, { status });
  }
}
