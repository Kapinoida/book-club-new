import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// List of admin email addresses
const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(email => email.trim()).filter(Boolean);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        // Check if user should be admin based on email
        const shouldBeAdmin = adminEmails.includes(user.email);
        
        // Update user admin status if needed
        await prisma.user.upsert({
          where: { email: user.email },
          update: { isAdmin: shouldBeAdmin },
          create: {
            email: user.email,
            name: user.name || "",
            image: user.image,
            isAdmin: shouldBeAdmin,
          },
        });
      }
      return true;
    },
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isAdmin: true, username: true },
        });
        session.user.isAdmin = dbUser?.isAdmin ?? false;
        session.user.username = dbUser?.username;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the user is signing in and doesn't have a username, redirect to username setup
      if (url.startsWith(baseUrl)) {
        const session = await prisma.session.findFirst({
          where: {
            expires: {
              gt: new Date(),
            },
          },
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            expires: "desc",
          },
        });

        if (session && !session.user.username) {
          return `${baseUrl}/setup-username`;
        }
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "database",
  },
};
