import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { SignUpInput, signUpSchema } from '../schemas/auth';

export class AuthService {
  /**
   * Handles user sign-up: validates input, creates Workspace and User atomically.
   */
  async signUp(input: SignUpInput) {
    // 1. Server-side validation per strict standards
    const parsed = signUpSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }

    const { name, email, password, workspaceName } = parsed.data;

    // 2. Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error('User already exists with that email.');
    }

    // 3. Hash password (using 10 salt rounds to match seed script exactly)
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Atomically create Workspace and the Admin User
    // Structurally impossible to cross-link to another tenant.
    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: workspaceName },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: Role.ADMIN, // Creator becomes ADMIN
          workspaceId: workspace.id,
        },
      });

      return { user, workspace };
    });

    return result.user;
  }
}
