import Navbar from "@/components/layout/Navbar";

const DRAWER_WIDTH = 260;
const NAVBAR_HEIGHT = 64;

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8F9FA" }}>
      <Navbar />

      {/* Sidebar spacer + Main content wrapper */}
      <div style={{ display: "flex" }}>
        {/* Desktop sidebar spacer — matches the permanent drawer width */}
        <div
          style={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
          }}
          className="hidden md:block"
        />

        {/* Main Content — offset below the fixed navbar */}
        <main
          style={{
            flexGrow: 1,
            minHeight: "100vh",
            paddingTop: NAVBAR_HEIGHT,
          }}
        >
          <div style={{ padding: "24px 32px", maxWidth: 1152 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
