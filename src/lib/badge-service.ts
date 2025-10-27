import { prisma } from "@/lib/prisma";
import { BadgeType } from "@prisma/client";

interface BadgeCheckResult {
  newBadges: string[];
}

export async function checkAndAwardBadges(userId: string): Promise<BadgeCheckResult> {
  const newBadges: string[] = [];

  // Get user's current badges
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true }
  });

  const awardedBadgeTypes = new Set(userBadges.map(ub => ub.badge.type));

  // Get user stats
  const [booksStarted, booksFinished, reviewCount, commentCount, helpfulReactions, insightfulReactions] = await Promise.all([
    prisma.readingProgress.count({ where: { userId } }),
    prisma.readingProgress.count({ where: { userId, isFinished: true } }),
    prisma.review.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.reaction.count({
      where: {
        comment: { userId },
        type: "HELPFUL"
      }
    }),
    prisma.reaction.count({
      where: {
        comment: { userId },
        type: "INSIGHTFUL"
      }
    })
  ]);

  // Check reading milestones
  if (booksStarted >= 1 && !awardedBadgeTypes.has(BadgeType.FIRST_BOOK)) {
    await awardBadge(userId, BadgeType.FIRST_BOOK);
    newBadges.push(BadgeType.FIRST_BOOK);
  }
  if (booksStarted >= 5 && !awardedBadgeTypes.has(BadgeType.FIVE_BOOKS)) {
    await awardBadge(userId, BadgeType.FIVE_BOOKS);
    newBadges.push(BadgeType.FIVE_BOOKS);
  }
  if (booksStarted >= 10 && !awardedBadgeTypes.has(BadgeType.TEN_BOOKS)) {
    await awardBadge(userId, BadgeType.TEN_BOOKS);
    newBadges.push(BadgeType.TEN_BOOKS);
  }
  if (booksStarted >= 25 && !awardedBadgeTypes.has(BadgeType.BOOKWORM)) {
    await awardBadge(userId, BadgeType.BOOKWORM);
    newBadges.push(BadgeType.BOOKWORM);
  }
  if (booksStarted >= 50 && !awardedBadgeTypes.has(BadgeType.AVID_READER)) {
    await awardBadge(userId, BadgeType.AVID_READER);
    newBadges.push(BadgeType.AVID_READER);
  }

  // Check review milestones
  if (reviewCount >= 1 && !awardedBadgeTypes.has(BadgeType.FIRST_REVIEW)) {
    await awardBadge(userId, BadgeType.FIRST_REVIEW);
    newBadges.push(BadgeType.FIRST_REVIEW);
  }
  if (reviewCount >= 10 && !awardedBadgeTypes.has(BadgeType.TOP_REVIEWER)) {
    await awardBadge(userId, BadgeType.TOP_REVIEWER);
    newBadges.push(BadgeType.TOP_REVIEWER);
  }

  // Check discussion milestones
  if (commentCount >= 1 && !awardedBadgeTypes.has(BadgeType.DISCUSSION_STARTER)) {
    await awardBadge(userId, BadgeType.DISCUSSION_STARTER);
    newBadges.push(BadgeType.DISCUSSION_STARTER);
  }
  if (commentCount >= 25 && !awardedBadgeTypes.has(BadgeType.ACTIVE_PARTICIPANT)) {
    await awardBadge(userId, BadgeType.ACTIVE_PARTICIPANT);
    newBadges.push(BadgeType.ACTIVE_PARTICIPANT);
  }
  if (commentCount >= 100 && !awardedBadgeTypes.has(BadgeType.COMMUNITY_LEADER)) {
    await awardBadge(userId, BadgeType.COMMUNITY_LEADER);
    newBadges.push(BadgeType.COMMUNITY_LEADER);
  }

  // Check reaction milestones
  if (helpfulReactions >= 10 && !awardedBadgeTypes.has(BadgeType.HELPFUL_MEMBER)) {
    await awardBadge(userId, BadgeType.HELPFUL_MEMBER);
    newBadges.push(BadgeType.HELPFUL_MEMBER);
  }
  if (insightfulReactions >= 10 && !awardedBadgeTypes.has(BadgeType.INSIGHTFUL_CONTRIBUTOR)) {
    await awardBadge(userId, BadgeType.INSIGHTFUL_CONTRIBUTOR);
    newBadges.push(BadgeType.INSIGHTFUL_CONTRIBUTOR);
  }

  return { newBadges };
}

async function awardBadge(userId: string, badgeType: BadgeType) {
  const badge = await prisma.badge.findUnique({
    where: { type: badgeType }
  });

  if (!badge) {
    console.error(`Badge ${badgeType} not found`);
    return;
  }

  await prisma.userBadge.create({
    data: {
      userId,
      badgeId: badge.id
    }
  });
}
