import "./generators.css";

export default function GeneratorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="generator-theme w-full">
      {children}
    </div>
  );
}
