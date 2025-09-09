import { Prisma } from "@prisma/client";

export type Book = Prisma.BookGetPayload<{}>;
export type User = Prisma.UserGetPayload<{}>;
export type ReadingProgress = Prisma.ReadingProgressGetPayload<{}>;
export type DiscussionQuestion = Prisma.DiscussionQuestionGetPayload<{}>;
export type Comment = Prisma.CommentGetPayload<{}>;
