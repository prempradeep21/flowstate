"use client";

import { AuthProvider } from "@/components/AuthProvider";
import { MotionProvider } from "@/lib/motion/MotionProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <AuthProvider>
        <div className="h-full w-full">{children}</div>
      </AuthProvider>
    </MotionProvider>
  );
}
