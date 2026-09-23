"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Kanban, Network } from "lucide-react";

export function ViewSwitcher() {
  const pathname = usePathname();

  const views = [
    { label: "Grid View", href: "/dashboard", icon: LayoutGrid, active: pathname === "/dashboard" },
    { label: "Kanban Board", href: "/dashboard/kanban", icon: Kanban, active: pathname === "/dashboard/kanban" },
    { label: "Knowledge Graph", href: "/dashboard/graph", icon: Network, active: pathname === "/dashboard/graph" },
  ];

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1 shadow-2xs">
      {views.map((v) => {
        const Icon = v.icon;
        return (
          <Link
            key={v.href}
            href={v.href}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              v.active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{v.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
