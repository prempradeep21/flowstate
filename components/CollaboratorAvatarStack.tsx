"use client";

import type { CanvasMember } from "@/lib/collaborationTypes";

type AvatarStackSize = "sm" | "md";

const sizeClasses: Record<
  AvatarStackSize,
  { avatar: string; text: string; overflow: string; stack: string }
> = {
  sm: {
    avatar: "h-7 w-7 border-[1.5px]",
    text: "text-[10px]",
    overflow: "text-[10px]",
    stack: "-space-x-1.5",
  },
  md: {
    avatar: "h-8 w-8 border-2",
    text: "text-xs",
    overflow: "text-xs",
    stack: "-space-x-2",
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
  if (members.length <= 1) return null;

  const visible = members.slice(0, maxVisible);
  const overflow = members.length - visible.length;
  const sizes = sizeClasses[size];

  const content = (
    <div className={`flex items-center ${sizes.stack}`}>
      {visible.map((member) => {
        const online = onlineUserIds.has(member.userId);
        const label = member.profile.displayName ?? "User";
        return (
          <div key={member.userId} className="relative">
            {member.profile.avatarUrl ? (
              <img
                src={member.profile.avatarUrl}
                alt={label}
                title={`${label}${online ? " (online)" : ""}`}
                className={`${sizes.avatar} rounded-full object-cover ${
                  online ? "border-green-500" : "border-canvas-card"
                }`}
              />
            ) : (
              <span
                title={`${label}${online ? " (online)" : ""}`}
                className={`flex ${sizes.avatar} items-center justify-center rounded-full bg-canvas-accent font-semibold text-white ${sizes.text} ${
                  online ? "border-green-500" : "border-canvas-card"
                }`}
              >
                {label.charAt(0).toUpperCase()}
              </span>
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
        className={`pointer-events-auto rounded-md transition-colors hover:bg-canvas-bg ${
          size === "sm" ? "px-1 py-0.5" : "rounded-lg px-1 py-1"
        }`}
        aria-label="View collaborators"
      >
        {content}
      </button>
    );
  }

  return content;
}
