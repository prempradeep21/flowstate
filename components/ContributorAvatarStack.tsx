"use client";

import type { CollaboratorProfile } from "@/lib/collaborationTypes";
import { collaboratorStatusDotClass } from "@/lib/collaboratorActivity";
import { useCollaboratorActivityMap } from "@/hooks/useCollaboratorActivity";

const MAX_VISIBLE = 4;

export function ContributorAvatarStack({
  profiles,
  size = 22,
  maxVisible = MAX_VISIBLE,
  onlineUserIds,
}: {
  profiles: CollaboratorProfile[];
  size?: number;
  maxVisible?: number;
  onlineUserIds?: Set<string>;
}) {
  const visible = profiles.slice(0, maxVisible);
  const overflow = profiles.length - visible.length;
  const activityByUserId = useCollaboratorActivityMap(
    profiles.length === 0 || !onlineUserIds
      ? []
      : visible.map((profile) => profile.id),
    onlineUserIds ?? new Set(),
  );

  if (profiles.length === 0) return null;

  return (
    <div className="flex items-center" aria-label="Contributors">
      {visible.map((profile, index) => (
        <ContributorAvatar
          key={profile.id}
          profile={profile}
          size={size}
          activity={
            onlineUserIds ? activityByUserId[profile.id] ?? null : null
          }
          style={{ marginLeft: index === 0 ? 0 : -(size * 0.3) }}
        />
      ))}
      {overflow > 0 && (
        <span
          className="flex shrink-0 items-center justify-center rounded-full border-2 border-canvas-card bg-canvas-bg text-canvas-micro font-semibold text-canvas-muted"
          style={{
            width: size,
            height: size,
            marginLeft: -(size * 0.3),
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

function ContributorAvatar({
  profile,
  size,
  activity,
  style,
}: {
  profile: CollaboratorProfile;
  size: number;
  activity: { label: string; status: "active" | "inactive" | "offline" } | null;
  style?: React.CSSProperties;
}) {
  const label = profile.displayName ?? "User";
  const title = activity ? `${label} — ${activity.label}` : label;
  const dotSize = Math.max(8, Math.round(size * 0.36));

  if (profile.avatarUrl) {
    return (
      <span className="relative shrink-0" style={style}>
        <img
          src={profile.avatarUrl}
          alt={label}
          title={title}
          className="rounded-full border-2 border-canvas-card object-cover"
          style={{ width: size, height: size }}
        />
        {activity && (
          <span
            className={`absolute rounded-full border-2 border-canvas-card ${collaboratorStatusDotClass(activity.status)}`}
            style={{
              width: dotSize,
              height: dotSize,
              right: -1,
              bottom: -1,
            }}
            aria-hidden
          />
        )}
      </span>
    );
  }

  const initial = label.charAt(0).toUpperCase();
  return (
    <span className="relative shrink-0" style={style}>
      <span
        title={title}
        className="flex items-center justify-center rounded-full border-2 border-canvas-card bg-canvas-accent text-canvas-micro font-semibold text-canvas-onAccent"
        style={{ width: size, height: size }}
      >
        {initial}
      </span>
      {activity && (
        <span
          className={`absolute rounded-full border-2 border-canvas-card ${collaboratorStatusDotClass(activity.status)}`}
          style={{
            width: dotSize,
            height: dotSize,
            right: -1,
            bottom: -1,
          }}
          aria-hidden
        />
      )}
    </span>
  );
}
