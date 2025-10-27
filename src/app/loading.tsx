import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Hero Section */}
      <Card className="text-center">
        <CardHeader>
          <Skeleton className="h-12 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
        </CardHeader>
      </Card>

      {/* Current Book Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Current Book</CardTitle>
              <CardDescription>Join us in reading this month's selection</CardDescription>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex justify-center">
              <Skeleton className="h-80 w-56" />
            </div>
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex gap-3 pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Book Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Coming Next Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-32 w-20 flex-shrink-0" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
