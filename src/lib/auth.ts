import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// List of admin email addresses
const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(email => email.trim()).filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Check database for user
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      console.log("[JWT Callback] Trigger:", trigger, "HasUser:", !!user, "Email:", token.email, "Current token.isAdmin:", token.isAdmin);

      // On initial sign in, user object is available
      if (user) {
        console.log("[JWT Callback] User object provided. User.isAdmin:", user.isAdmin);
        token.isAdmin = user.isAdmin ?? false;
      }

      // Always refresh from database if isAdmin is not set
      // This ensures we pick up admin status changes
      if (token.isAdmin === undefined && token.email) {
        console.log("[JWT Callback] isAdmin is undefined, fetching from DB");
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { isAdmin: true }
          });
          if (dbUser) {
            console.log("[JWT Callback] DB User.isAdmin:", dbUser.isAdmin);
            token.isAdmin = dbUser.isAdmin;
          } else {
            console.log("[JWT Callback] User not found in database");
            token.isAdmin = false;
          }
        } catch (error) {
          console.error("[JWT Callback] Error fetching user admin status:", error);
          token.isAdmin = false;
        }
      }

      console.log("[JWT Callback] Final token.isAdmin:", token.isAdmin);
      return token;
    },
    async session({ session, token }) {
      console.log("[Session Callback] token.isAdmin:", token.isAdmin);
      if (session?.user) {
        session.user.id = token.sub!;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      console.log("[Session Callback] session.user.isAdmin:", session?.user?.isAdmin);
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
};
