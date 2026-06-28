export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full overflow-hidden">{children}</div>;
}
