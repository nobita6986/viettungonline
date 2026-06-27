import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('CRITICAL: NEXTAUTH_SECRET environment variable is missing. Server stopped to prevent security vulnerabilities.');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Tài khoản', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập tài khoản và mật khẩu');
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });

        if (!user || !user.isActive) {
          throw new Error('Người dùng không tồn tại hoặc đã bị khóa');
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) {
          throw new Error('Mật khẩu không chính xác');
        }

        const userPermissions = await prisma.userPermission.findMany({
          where: { userId: user.id },
          include: { permission: true }
        });
        const rolePermissions = user.roleId ? await prisma.rolePermission.findMany({
          where: { roleId: user.roleId },
          include: { permission: true }
        }) : [];

        const permissions = [
          ...userPermissions.map(p => p.permission.code),
          ...rolePermissions.map(p => p.permission.code)
        ];

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.name || 'GUEST',
          roleId: user.roleId,
          permissions: Array.from(new Set(permissions)),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.roleId = (user as any).roleId;
        token.permissions = (user as any).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).roleId = token.roleId as string;
        (session.user as any).permissions = token.permissions as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Hàm hỗ trợ kiểm tra quyền của User hiện tại trên Server/API
 * Ném lỗi 403 Forbidden nếu không có quyền
 */
export async function checkPermission(requiredPermission: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    throw new Error('UNAUTHORIZED');
  }

  const permissions = (session.user as any).permissions || [];
  
  if (!permissions.includes(requiredPermission) && !permissions.includes('ADMIN_ALL')) {
    throw new Error('FORBIDDEN: You do not have permission to perform this action');
  }
  
  return session.user;
}
