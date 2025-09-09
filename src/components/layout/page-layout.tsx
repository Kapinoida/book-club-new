"use client";

import { Navbar } from "./navbar";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background font-sans antialiased">
      <div className="relative flex min-h-screen flex-col">
        <Navbar />
        <main className={cn("flex-1", className)}>
          <div className="container py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
