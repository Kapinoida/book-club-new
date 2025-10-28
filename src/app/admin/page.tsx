"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAdminStats, useAdminActivity } from "@/hooks/use-admin";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: activity, isLoading: activityLoading } = useAdminActivity();

  const isLoading = statsLoading || activityLoading;

  return (
    <AdminGuard>
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your book club from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalBooks ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalComments ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Discussion Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalQuestions ?? 0}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Books */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Books</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {activity?.recentBooks && activity.recentBooks.length > 0 ? (
                    activity.recentBooks.map((book) => (
                      <Link
                        key={book.id}
                        href={`/admin/books/${book.id}/edit`}
                        className="flex justify-between items-center hover:bg-accent/50 p-2 rounded-md transition-colors"
                      >
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-muted-foreground">
                            by {book.author}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {book.readMonth
                            ? new Date(book.readMonth).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                              })
                            : book.status === "POLL_CANDIDATE"
                            ? "Available for polls"
                            : "No date set"}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No books added yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Comments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {activity?.recentComments && activity.recentComments.length > 0 ? (
                    activity.recentComments.map((comment) => (
                      <div key={comment.id}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">
                                {comment.user.name || comment.user.username}
                              </span>{" "}
                              commented on{" "}
                              <span className="font-medium">{comment.book.title}</span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {comment.content}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent comments</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/admin/books">Manage Books</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/polls">Manage Polls</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/users">Manage Users</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/discussions">Manage Discussions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
