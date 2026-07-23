import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] overflow-x-hidden">
      {/* Admin Top Bar */}
      <div
        className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #1B4F72 0%, #1F3A60 100%)",
          boxShadow: "0 2px 8px rgba(27, 79, 114, 0.3)",
        }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold text-sm">
            🛡️ Admin Panel
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            {user.email}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="text-xs text-white/70 hover:text-white transition-colors no-underline"
          >
            View Portal →
          </a>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="border-b border-[#E2E8F0] bg-white px-4 md:px-6 py-2">
        <nav className="flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
          {[
            { href: "/admin/dashboard", label: "Overview" },
            { href: "/admin/notices", label: "Notices" },
            { href: "/admin/routine", label: "Routine" },
            { href: "/admin/deadlines", label: "Academic Schedule" },
            { href: "/admin/documents", label: "Documents" },
            { href: "/admin/settings", label: "Settings" },
            { href: "/admin/students", label: "Students" },
            { href: "/admin/templates", label: "Templates" },
            { href: "/admin/teachers", label: "Teachers" },
            { href: "/admin/courses", label: "Running Courses" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-4 py-2 text-sm font-medium text-[#4A5568] hover:text-[#1B4F72] hover:bg-[#F1F5F9] rounded-lg transition-colors no-underline shrink-0"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="p-4 md:p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
