import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PollsLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-4xl">Book Selection Polls</CardTitle>
          <CardDescription className="text-lg">
            Vote for the books you'd like to read next! The book with the most votes
            will be selected for the upcoming month.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Loading skeleton for polls */}
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-grow">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((j) => (
                <Card key={j}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-32 w-20 flex-shrink-0" />
                      <div className="flex-grow space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-2 w-full mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
