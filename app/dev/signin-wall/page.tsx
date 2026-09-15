"use client";

import { useState } from "react";
import { SignInWallModal } from "@/components/billing/SignInWallModal";
import { Button } from "@/components/ui/Button";

/** Dev-only harness for eyeballing the guest sign-in wall in both themes. */
export default function SignInWallPreview() {
  const [open, setOpen] = useState(true);
  const [count, setCount] = useState<number | null>(12);

  return (
    <div className="min-h-screen bg-canvas-bg p-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-canvas-heading font-semibold text-canvas-ink">
          Sign-in wall preview
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)}>Open</Button>
          <Button variant="ghost" onClick={() => setCount(12)}>
            With count
          </Button>
          <Button variant="ghost" onClick={() => setCount(null)}>
            Without count
          </Button>
        </div>
      </div>
      <SignInWallModal
        isOpen={open}
        questionsAsked={count}
        onSignIn={() => {
          // Preview only — the real caller passes AuthProvider.signInWithGoogle.
          return new Promise((r) => setTimeout(r, 1200));
        }}
        onDismiss={() => setOpen(false)}
      />
    </div>
  );
}
