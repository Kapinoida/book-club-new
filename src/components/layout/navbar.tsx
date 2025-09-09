"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/" },
    ...(session
      ? [
          { name: "Current Book", href: "/books/current" },
          { name: "Archive", href: "/archive" },
        ]
      : []),
    ...(session?.user.isAdmin ? [{ name: "Admin", href: "/admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Book Club</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {session ? (
            <>
              <span className="text-sm text-muted-foreground">
                {session.user.name}
              </span>
              <Button
                variant="ghost"
                onClick={() => signOut()}
                className="text-sm"
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => signIn("google")}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
