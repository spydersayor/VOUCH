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
    <aside className="w-64 flex-shrink-0 border-r border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-xl p-4 min-h-screen">
      <div className="mb-5 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/80 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
        <span>{role.toUpperCase()} WORKSPACE</span>
      </div>
      <nav className="space-y-1.5">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-xl px-3.5 py-2.5 font-mono text-xs tracking-wider transition-all",
                isActive
                  ? "bg-violet-950/40 text-white border border-violet-400/40 shadow-[0_0_12px_rgba(168,85,247,0.2)] font-semibold"
                  : "text-[#8b8ea0] hover:bg-white/[0.04] hover:text-white border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4", isActive ? "text-violet-300" : "text-[#5c5c68]")} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full border border-violet-400/30 bg-violet-950/40 px-2 py-0.5 text-[9px] font-mono font-bold text-violet-300 uppercase">
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
