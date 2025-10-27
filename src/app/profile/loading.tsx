import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
            <div className="flex-grow space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reading Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Current Reading Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-32 w-20 flex-shrink-0" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full mt-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Your Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <Skeleton className="h-5 w-48" />
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
