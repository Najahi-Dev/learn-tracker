import { SidebarNav } from "@/components/sidebar-nav";
import { FocusProvider } from "@/components/providers/focus-provider";
import { FloatingFocusBar } from "@/components/focus/floating-focus-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FocusProvider>
      <div className="flex min-h-screen flex-col md:flex-row bg-background">
        <SidebarNav />
        <main className="flex-1 min-w-0 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <FloatingFocusBar />
      </div>
    </FocusProvider>
  );
}
