"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  Layers,
  Kanban,
  Network,
  Calendar,
  BrainCircuit,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandMenu } from "@/components/command-menu";
import { ZenFocusModal } from "@/components/focus/zen-focus-modal";
import { Button } from "@/components/ui/button";

export function SidebarNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      label: "Topics Overview",
      href: "/dashboard",
      icon: Layers,
      active: pathname === "/dashboard",
    },
    {
      label: "Kanban Board",
      href: "/dashboard/kanban",
      icon: Kanban,
      active: pathname === "/dashboard/kanban",
    },
    {
      label: "Knowledge Graph",
      href: "/dashboard/graph",
      icon: Network,
      active: pathname === "/dashboard/graph",
    },
    {
      label: "Daily Planner",
      href: "/dashboard/planner",
      icon: Calendar,
      active: pathname === "/dashboard/planner",
    },
    {
      label: "Spaced Reviews",
      href: "/dashboard/reviews",
      icon: BrainCircuit,
      active: pathname === "/dashboard/reviews",
    },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="flex md:hidden h-14 w-full items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold">MindForge</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="h-8 w-8"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-border/60 bg-card/90 backdrop-blur-md transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header & Nav */}
        <div className="flex flex-col gap-6 p-5">
          {/* Brand Logo */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <span className="text-base font-bold leading-none block">MindForge</span>
                <span className="text-[10px] font-medium text-muted-foreground">Study & Skill Tracker</span>
              </div>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="w-full">
            <CommandMenu />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <span className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Workspace
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer ${
                    item.active
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${item.active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions & Focus */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <span className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 block">
              Deep Work
            </span>
            <div className="w-full">
              <ZenFocusModal />
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="flex items-center justify-between border-t border-border/60 p-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <UserButton />
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">My Account</p>
              <p className="text-[10px] text-muted-foreground">Active Session</p>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
