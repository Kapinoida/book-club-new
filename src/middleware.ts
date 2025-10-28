import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Check if user is accessing admin routes
    if (req.nextUrl.pathname.startsWith("/admin")) {
      console.log("Admin route access attempt:", {
        path: req.nextUrl.pathname,
        isAdmin: req.nextauth.token?.isAdmin,
        email: req.nextauth.token?.email
      });

      // Verify user has admin permissions
      if (!req.nextauth.token?.isAdmin) {
        console.log("Access denied - redirecting to home");
        return NextResponse.redirect(new URL("/", req.url));
      }

      console.log("Access granted - admin verified");
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (!req.nextUrl.pathname.startsWith("/admin")) {
          return true;
        }
        
        // For admin routes, check if user is authenticated and is admin
        return !!token && !!token.isAdmin;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};