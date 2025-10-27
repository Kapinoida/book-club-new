import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookPageLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Book Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Book Cover */}
            <div className="flex justify-center">
              <Skeleton className="h-96 w-64" />
            </div>

            {/* Book Info */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-5 w-40" />
              </div>

              <div>
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>

      {/* Discussion Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Discussion Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Member Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-grow">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
