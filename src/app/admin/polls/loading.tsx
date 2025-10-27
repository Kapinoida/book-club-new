import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPollsLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-4xl">Manage Polls</CardTitle>
              <CardDescription className="text-lg">
                Create and manage book selection polls
              </CardDescription>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Polls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-32" />
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
