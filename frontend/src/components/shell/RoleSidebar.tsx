"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  FileCheck,
  Sparkles,
  Award,
  PlusCircle,
  FolderGit2,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Compass,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleSidebarProps {
  role: "student" | "expert" | "sponsor" | "admin";
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export function RoleSidebar({ role }: RoleSidebarProps) {
  const pathname = usePathname();

  const studentItems: NavItem[] = [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Browse Problems", href: "/open-problems", icon: Search },
    { label: "My Applications", href: "/student/applications", icon: FileCheck },
    { label: "Invitations & Matches", href: "/student/matches", icon: Sparkles, badge: "New" },
    { label: "Project Workspace", href: "/projects/proj_retinopathy/workspace", icon: FolderGit2, badge: "Active" },
    { label: "Ledger Timeline", href: "/projects/proj_retinopathy/timeline", icon: ShieldCheck },
    { label: "Verified Credentials", href: "/student/credentials", icon: Award },
    { label: "Profile & Ratings", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const expertItems: NavItem[] = [
    { label: "Advisory Console", href: "/expert", icon: LayoutDashboard },
    { label: "Invitations & Matches", href: "/expert/matches", icon: Compass, badge: "Match" },
    { label: "Review Workspace", href: "/projects/proj_retinopathy/workspace", icon: FolderGit2, badge: "Review" },
    { label: "Ledger Timeline", href: "/projects/proj_retinopathy/timeline", icon: ShieldCheck },
    { label: "Conflicts of Interest", href: "/expert/conflicts", icon: AlertTriangle },
    { label: "Profile & Ratings", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const sponsorItems: NavItem[] = [
    { label: "Sponsor Console", href: "/sponsor", icon: LayoutDashboard },
    { label: "Post a Problem", href: "/sponsor/post-problem", icon: PlusCircle, badge: "AI Scope" },
    { label: "My Initiatives", href: "/sponsor/projects", icon: FolderGit2 },
    { label: "Active Workspace", href: "/projects/proj_retinopathy/workspace", icon: FolderGit2, badge: "Live" },
    { label: "Audit Timeline", href: "/projects/proj_retinopathy/timeline", icon: ShieldCheck },
    { label: "Wallet & Escrow", href: "/sponsor/wallet", icon: Wallet },
    { label: "Company Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const adminItems: NavItem[] = [
    { label: "Governance Console", href: "/admin", icon: ShieldCheck },
    { label: "Project Workspace", href: "/projects/proj_retinopathy/workspace", icon: FolderGit2 },
    { label: "Ledger Timeline", href: "/projects/proj_retinopathy/timeline", icon: ShieldCheck },
    { label: "My Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  let items: NavItem[] = [];
  if (role === "student") items = studentItems;
  else if (role === "expert") items = expertItems;
  else if (role === "sponsor") items = sponsorItems;
  else if (role === "admin") items = adminItems;

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {role.toUpperCase()} WORKSPACE
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                isActive
                  ? "bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("h-4 w-4", isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400")} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
