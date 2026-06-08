"use client";

import { AuthProvider } from "@/components/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider><div className="h-full w-full">{children}</div></AuthProvider>;
}
