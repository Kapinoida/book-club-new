import NextAuth from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
      username?: string | null;
    };
  }

  interface User {
    isAdmin?: boolean;
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    username?: string | null;
  }
}
