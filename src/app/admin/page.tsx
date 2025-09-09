import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin/admin-guard";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getStats() {
  const [totalBooks, totalUsers, totalComments, totalQuestions] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.discussionQuestion.count(),
  ]);

  return {
    totalBooks,
    totalUsers,
    totalComments,
    totalQuestions,
  };
}

async function getRecentActivity() {
  const recentBooks = await prisma.book.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
    select: {
      title: true,
      author: true,
      readMonth: true,
      created_at: true,
    },
  });

  const recentComments = await prisma.comment.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
    include: {
      user: {
        select: { name: true, username: true },
      },
      book: {
        select: { title: true },
      },
    },
  });

  return { recentBooks, recentComments };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const activity = await getRecentActivity();

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discussion Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Books */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.recentBooks.map((book, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{book.title}</p>
                      <p className="text-sm text-muted-foreground">
                        by {book.author}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {book.readMonth.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.recentComments.map((comment) => (
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
                        {comment.created_at.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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