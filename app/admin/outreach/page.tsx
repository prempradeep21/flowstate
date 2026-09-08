import type { Metadata } from "next";
import { OutreachDeck } from "@/components/outreach/OutreachDeck";

export const metadata: Metadata = {
  title: "Flowstate — podcaster outreach",
  description: "Messaging variants, target shortlist and pilot playbook for the podcaster pilots.",
};

/**
 * Internal decision surface for choosing outreach copy before any of it is
 * sent. It names real hosts alongside their likely objections and the warm
 * intro route to each, so it lives under /admin — behind getAdminUser — rather
 * than on a public route. If a podcaster-facing page is wanted later, that
 * should be a separate surface built from the copy variants only.
 */
export default function OutreachPage() {
  return <OutreachDeck />;
}
