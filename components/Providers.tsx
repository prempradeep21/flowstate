"use client";

import { AuthProvider } from "@/components/AuthProvider";
import { LocalReadOnlyBanner } from "@/components/LocalReadOnlyBanner";
import { MotionProvider } from "@/lib/motion/MotionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <AuthProvider>
        <div className="relative h-full w-full">
          {children}
          <LocalReadOnlyBanner />
        </div>
      </AuthProvider>
    </MotionProvider>
  );
}
