export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full overflow-x-hidden overflow-y-auto bg-canvas-bg">
      {children}
    </div>
  );
}
