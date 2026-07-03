export default function Landing2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="landing2-scroll-root"
      className="h-full overflow-x-hidden overflow-y-auto bg-canvas-bg"
    >
      <div id="landing2-scroll-content">{children}</div>
    </div>
  );
}
