"use client";

import type { ReactNode } from "react";
import { FlowstateBrand } from "@/components/FlowstateBrand";
import { ProfileMenu } from "@/components/ProfileMenu";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";

export function HomeHeader({
  search,
}: {
  /** Canvas-title search, shown beside the account controls when present. */
  search?: ReactNode;
}) {
  const { user, supabaseConfigured, signInWithGoogle } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-canvas-border bg-canvas-card shadow-card">
      <div className="mx-auto flex w-full max-w-[86rem] flex-wrap items-center gap-x-2.5 gap-y-3 px-6 py-3 sm:flex-nowrap sm:px-8">
        <div className="mr-auto">
          <FlowstateBrand variant="lockup" />
        </div>

        {search ? (
          // Its own full-width row under the brand on phones; a compact
          // field beside the account controls from sm up.
          <div className="order-last w-full min-w-0 sm:order-none sm:w-60">
            {search}
          </div>
        ) : null}

        {supabaseConfigured && (
          <div className="flex shrink-0 items-center">
            {user ? (
              <ProfileMenu align="right" showNameOnMobile={false} />
            ) : (
              <Button variant="primary" onClick={() => void signInWithGoogle()}>
                Sign in
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
