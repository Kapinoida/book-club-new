import { PrismaClient, BadgeType } from "@prisma/client";

const prisma = new PrismaClient();

const badges = [
  // Reading Milestones
  {
    type: BadgeType.FIRST_BOOK,
    name: "First Steps",
    description: "Started your first book",
    icon: "📖",
    color: "#94a3b8",
    tier: 1
  },
  {
    type: BadgeType.FIVE_BOOKS,
    name: "Book Explorer",
    description: "Started 5 books",
    icon: "📚",
    color: "#60a5fa",
    tier: 2
  },
  {
    type: BadgeType.TEN_BOOKS,
    name: "Dedicated Reader",
    description: "Started 10 books",
    icon: "📗",
    color: "#34d399",
    tier: 2
  },
  {
    type: BadgeType.BOOKWORM,
    name: "Bookworm",
    description: "Started 25 books",
    icon: "🐛",
    color: "#fbbf24",
    tier: 3
  },
  {
    type: BadgeType.AVID_READER,
    name: "Avid Reader",
    description: "Started 50 books",
    icon: "🏆",
    color: "#f59e0b",
    tier: 4
  },

  // Review Milestones
  {
    type: BadgeType.FIRST_REVIEW,
    name: "First Impressions",
    description: "Wrote your first review",
    icon: "⭐",
    color: "#94a3b8",
    tier: 1
  },
  {
    type: BadgeType.TOP_REVIEWER,
    name: "Top Reviewer",
    description: "Wrote 10 reviews",
    icon: "🌟",
    color: "#fbbf24",
    tier: 3
  },

  // Discussion Milestones
  {
    type: BadgeType.DISCUSSION_STARTER,
    name: "Discussion Starter",
    description: "Posted your first comment",
    icon: "💬",
    color: "#94a3b8",
    tier: 1
  },
  {
    type: BadgeType.ACTIVE_PARTICIPANT,
    name: "Active Participant",
    description: "Posted 25 comments",
    icon: "💭",
    color: "#60a5fa",
    tier: 2
  },
  {
    type: BadgeType.COMMUNITY_LEADER,
    name: "Community Leader",
    description: "Posted 100 comments",
    icon: "👑",
    color: "#f59e0b",
    tier: 4
  },

  // Reaction Milestones
  {
    type: BadgeType.HELPFUL_MEMBER,
    name: "Helpful Member",
    description: "Received 10 helpful reactions",
    icon: "🤝",
    color: "#34d399",
    tier: 2
  },
  {
    type: BadgeType.INSIGHTFUL_CONTRIBUTOR,
    name: "Insightful Contributor",
    description: "Received 10 insightful reactions",
    icon: "💡",
    color: "#fbbf24",
    tier: 3
  },

  // Special Badges
  {
    type: BadgeType.EARLY_ADOPTER,
    name: "Early Adopter",
    description: "Joined during the first month",
    icon: "🚀",
    color: "#a78bfa",
    tier: 4
  },

  // Streak Badges (Weekly engagement)
  {
    type: BadgeType.STREAK_STARTER,
    name: "Streak Starter",
    description: "Active for 4 consecutive weeks",
    icon: "🔥",
    color: "#94a3b8",
    tier: 1
  },
  {
    type: BadgeType.DEDICATED_READER,
    name: "Dedicated Reader",
    description: "Active for 12 consecutive weeks",
    icon: "🔥",
    color: "#f97316",
    tier: 3
  },
  {
    type: BadgeType.READING_CHAMPION,
    name: "Reading Champion",
    description: "Active for 52 consecutive weeks",
    icon: "🏅",
    color: "#dc2626",
    tier: 4
  }
];

async function seedBadges() {
  console.log("Seeding badges...");

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { type: badge.type },
      update: badge,
      create: badge
    });
  }

  console.log("✅ Badges seeded successfully!");
}

seedBadges()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
