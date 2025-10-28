"use client";

interface Badge {
  icon: string;
  name: string;
  color: string;
}

interface PinnedBadgeIconProps {
  badge: Badge;
  size?: "sm" | "md";
}

export function PinnedBadgeIcon({ badge, size = "sm" }: PinnedBadgeIconProps) {
  const sizeClass = size === "sm" ? "text-base" : "text-xl";

  return (
    <span
      className={`inline-block ${sizeClass} ml-1`}
      style={{ color: badge.color }}
      title={badge.name}
    >
      {badge.icon}
    </span>
  );
}
