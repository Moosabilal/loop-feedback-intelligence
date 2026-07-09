import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/AuthService';

const authService = new AuthService();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // AuthService handles Zod validation and transactional creation
    const user = await authService.signUp(body);

    return NextResponse.json(
      { message: 'User created successfully', user: { email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'An error occurred during sign up' },
      { status: 400 }
    );
  }
}
