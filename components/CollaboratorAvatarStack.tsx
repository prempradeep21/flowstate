"use client";

import type { CanvasMember } from "@/lib/collaborationTypes";

export function CollaboratorAvatarStack({
  members,
  onlineUserIds,
  onClick,
  maxVisible = 5,
}: {
  members: CanvasMember[];
  onlineUserIds: Set<string>;
  onClick?: () => void;
  maxVisible?: number;
}) {
  if (members.length <= 1) return null;

  const visible = members.slice(0, maxVisible);
  const overflow = members.length - visible.length;

  const content = (
    <div className="flex items-center -space-x-2">
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
                className={`h-8 w-8 rounded-full border-2 object-cover ${
                  online
                    ? "border-green-500"
                    : "border-canvas-card"
                }`}
              />
            ) : (
              <span
                title={`${label}${online ? " (online)" : ""}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-canvas-accent text-xs font-semibold text-white ${
                  online
                    ? "border-green-500"
                    : "border-canvas-card"
                }`}
              >
                {label.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        );
      })}
      {overflow > 0 && (
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-canvas-card bg-canvas-bg text-xs font-medium text-canvas-muted">
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
        className="pointer-events-auto rounded-lg px-1 py-1 transition-colors hover:bg-canvas-bg"
        aria-label="View collaborators"
      >
        {content}
      </button>
    );
  }

  return content;
}
