import { prisma } from "@/lib/prisma";

/**
 * Get the ISO week string for a given date (e.g., "2024-W42")
 */
function getISOWeek(date: Date): string {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${target.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Check if two week strings are consecutive
 */
function areConsecutiveWeeks(week1: string, week2: string): boolean {
  const [year1, w1] = week1.split('-W').map(Number);
  const [year2, w2] = week2.split('-W').map(Number);

  if (year1 === year2) {
    return w2 === w1 + 1;
  }

  // Check if week2 is first week of next year and week1 is last week of previous year
  if (year2 === year1 + 1 && w2 === 1) {
    // week1 should be around week 52 or 53
    return w1 >= 52;
  }

  return false;
}

/**
 * Update user's streak based on activity in current week
 * Call this whenever a user performs an activity (comment, review, progress update, etc.)
 */
export async function updateUserStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  isNewWeek: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActiveWeek: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const currentWeek = getISOWeek(new Date());
  const lastActiveWeek = user.lastActiveWeek;

  let newCurrentStreak = user.currentStreak;
  let isNewWeek = false;

  // First time tracking activity
  if (!lastActiveWeek) {
    newCurrentStreak = 1;
    isNewWeek = true;
  }
  // Same week - no change to streak
  else if (lastActiveWeek === currentWeek) {
    // No update needed
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      isNewWeek: false
    };
  }
  // Consecutive week
  else if (areConsecutiveWeeks(lastActiveWeek, currentWeek)) {
    newCurrentStreak = user.currentStreak + 1;
    isNewWeek = true;
  }
  // Streak broken - start over
  else {
    newCurrentStreak = 1;
    isNewWeek = true;
  }

  const newLongestStreak = Math.max(user.longestStreak, newCurrentStreak);

  // Update user's streak
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveWeek: currentWeek
    }
  });

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    isNewWeek
  };
}

/**
 * Get user's current streak information
 */
export async function getUserStreak(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActiveWeek: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const currentWeek = getISOWeek(new Date());

  // Check if streak is still active (was active this week or last week)
  let isActive = false;
  if (user.lastActiveWeek) {
    isActive = user.lastActiveWeek === currentWeek ||
               areConsecutiveWeeks(user.lastActiveWeek, currentWeek);
  }

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActiveWeek: user.lastActiveWeek,
    isActive
  };
}
