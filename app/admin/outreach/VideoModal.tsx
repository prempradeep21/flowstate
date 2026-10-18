"use client";

import { OutreachModal } from "@/app/admin/outreach/OutreachModal";

export function VideoModal({
  src,
  title,
  onClose,
}: {
  src: string | null;
  title: string;
  onClose: () => void;
}) {
  // Unmounting the <video> when the modal closes stops playback.
  return (
    <OutreachModal isOpen={src !== null} title={title} onClose={onClose} widthClass="max-w-5xl">
      {src ? (
        <video
          key={src}
          src={src}
          controls
          autoPlay
          playsInline
          className="aspect-video w-full rounded-canvas-md bg-black"
        />
      ) : null}
    </OutreachModal>
  );
}
