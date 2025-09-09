import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { SignInButton } from "@/components/auth/sign-in-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function SignIn() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="container max-w-md">
      <Card className="mt-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Welcome to Book Club</CardTitle>
          <CardDescription>
            Sign in to join discussions and track your reading progress
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Image
              src="/images/reading.svg"
              alt="Reading illustration"
              width={200}
              height={200}
              priority
            />
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Join Our Community</h2>
              <p className="text-sm text-muted-foreground">
                Connect with fellow readers, track your progress, and
                participate in thoughtful discussions
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">
                Continue with
              </span>
            </div>
          </div>

          <SignInButton />

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
