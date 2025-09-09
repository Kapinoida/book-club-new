import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsernameForm } from "@/components/auth/username-form";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function SetupUsername() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  // Check if user already has a username
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  if (user?.username) {
    redirect("/");
  }

  return (
    <div className="container max-w-md">
      <Card className="mt-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Choose Your Username</CardTitle>
          <CardDescription>
            Pick a unique username to identify yourself in discussions
          </CardDescription>
        </CardHeader>

        <CardContent>
          <UsernameForm />
        </CardContent>
      </Card>
    </div>
  );
}
