import { Landing2App } from "@/components/landing2/Landing2App";

export const metadata = {
  title: "Flowstate — An open canvas for your AI work",
  description:
    "AI work was never meant to disappear into a chat. Flowstate is a spatial canvas where prompts, docs, research, and artifacts live together — findable, reusable, and shareable.",
  openGraph: {
    title: "Flowstate — An open canvas for your AI work",
    description:
      "Think in space, not in a list. Branch parallel threads, create artifacts, and share progress on a spatial canvas.",
    url: "https://flowstatetool.com/landing2",
  },
};

export default function Landing2Page() {
  return <Landing2App />;
}
