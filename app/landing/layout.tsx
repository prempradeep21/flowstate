export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="landing-scroll-root"
      className="h-full overflow-x-hidden overflow-y-auto bg-canvas-bg"
    >
      {children}
    </div>
  );
}
