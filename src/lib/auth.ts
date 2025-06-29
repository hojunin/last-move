import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "@vercel/postgres";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 사용자 조회
          const result = await sql`
            SELECT id, email, password_hash, name, avatar_url, is_active
            FROM users 
            WHERE email = ${credentials.email as string} AND is_active = true
          `;

          if (result.rows.length === 0) {
            return null;
          }

          const user = result.rows[0];

          // 비밀번호 확인
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          );

          if (!isPasswordValid) {
            return null;
          }

          // 마지막 로그인 시간 업데이트
          await sql`
            UPDATE users 
            SET last_login_at = NOW()
            WHERE id = ${user.id}
          `;

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar_url,
          };
        } catch (error) {
          console.error("인증 오류:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 1년 (초 단위)
  },
  jwt: {
    maxAge: 365 * 24 * 60 * 60, // 1년 (초 단위)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
