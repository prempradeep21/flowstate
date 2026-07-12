"use client";

import type { CanvasMember } from "@/lib/collaborationTypes";
import { collaboratorStatusDotClass } from "@/lib/collaboratorActivity";
import { useCollaboratorActivityMap } from "@/hooks/useCollaboratorActivity";

type AvatarStackSize = "sm" | "md";

const sizeClasses: Record<
  AvatarStackSize,
  { avatar: string; text: string; overflow: string; stack: string; dot: string }
> = {
  sm: {
    avatar: "h-7 w-7 border-[1.5px]",
    text: "text-canvas-micro",
    overflow: "text-canvas-micro",
    stack: "-space-x-1.5",
    dot: "h-2 w-2 border-[1.5px]",
  },
  md: {
    avatar: "h-8 w-8 border-2",
    text: "text-canvas-compact",
    overflow: "text-canvas-compact",
    stack: "-space-x-2",
    dot: "h-2.5 w-2.5 border-2",
  },
};

export function CollaboratorAvatarStack({
  members,
  onlineUserIds,
  onClick,
  maxVisible = 5,
  size = "md",
}: {
  members: CanvasMember[];
  onlineUserIds: Set<string>;
  onClick?: () => void;
  maxVisible?: number;
  size?: AvatarStackSize;
}) {
  const visible = members.slice(0, maxVisible);
  const overflow = members.length - visible.length;
  const sizes = sizeClasses[size];
  const activityByUserId = useCollaboratorActivityMap(
    members.length <= 1 ? [] : visible.map((member) => member.userId),
    onlineUserIds,
  );

  if (members.length <= 1) return null;

  const content = (
    <div className={`flex items-center ${sizes.stack}`}>
      {visible.map((member) => {
        const label = member.profile.displayName ?? "User";
        const activity = activityByUserId[member.userId];
        const title = activity ? `${label} — ${activity.label}` : label;
        return (
          <div key={member.userId} className="relative">
            {member.profile.avatarUrl ? (
              <img
                src={member.profile.avatarUrl}
                alt={label}
                title={title}
                className={`${sizes.avatar} rounded-full object-cover border-canvas-card`}
              />
            ) : (
              <span
                title={title}
                className={`flex ${sizes.avatar} items-center justify-center rounded-full border-canvas-card bg-canvas-accent font-semibold text-canvas-onAccent ${sizes.text}`}
              >
                {label.charAt(0).toUpperCase()}
              </span>
            )}
            {activity && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 rounded-full border-canvas-card ${sizes.dot} ${collaboratorStatusDotClass(activity.status)}`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
      {overflow > 0 && (
        <span
          className={`flex ${sizes.avatar} items-center justify-center rounded-full border-canvas-card bg-canvas-bg font-medium text-canvas-muted ${sizes.overflow}`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`pointer-events-auto rounded-canvas transition-colors hover:bg-canvas-bg ${
          size === "sm" ? "px-1 py-0.5" : "rounded-canvas px-1 py-1"
        }`}
        aria-label="View collaborators"
      >
        {content}
      </button>
    );
  }

  return content;
}
