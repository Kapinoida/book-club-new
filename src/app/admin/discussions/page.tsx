"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminGuard } from "@/components/admin/admin-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Plus, MessageSquare, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ManageDiscussions() {
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const response = await fetch('/api/admin/discussions');
        if (response.ok) {
          const discussionsData = await response.json();
          setDiscussions(discussionsData);
        } else {
          toast.error('Failed to fetch discussions');
        }
      } catch (error) {
        toast.error('Failed to fetch discussions');
        console.error('Error fetching discussions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscussions();
  }, []);

  const handleDelete = async (discussionId: string) => {
    if (!confirm('Are you sure you want to delete this discussion question? This action cannot be undone and will remove all responses.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discussions/${discussionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDiscussions(discussions.filter(discussion => discussion.id !== discussionId));
        toast.success('Discussion question deleted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete discussion question');
      }
    } catch (error) {
      toast.error('Failed to delete discussion question');
      console.error('Error deleting discussion:', error);
    }
  };

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-4 mt-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Manage Discussions</h1>
              <p className="text-muted-foreground">
                Create and manage discussion questions for your books
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/admin/discussions/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Link>
          </Button>
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <Card key={discussion.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{discussion.bookTitle}</span>
                      <Badge variant="outline">
                        {discussion.breakpoint}% mark
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-6">
                      {discussion.question}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {discussion.responses} responses
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(discussion.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/discussions/${discussion.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/books/${discussion.bookId}/discussions/${discussion.id}`}>
                        View Responses
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => handleDelete(discussion.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {discussions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No discussion questions yet</h3>
              <p className="text-muted-foreground mb-4">
                Create engaging questions to spark conversations about your books
              </p>
              <Button asChild>
                <Link href="/admin/discussions/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Question
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminGuard>
  );
}