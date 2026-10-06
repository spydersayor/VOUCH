"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  FolderSearch,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DemoGuide } from "@/components/common/DemoGuide";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    user,
    notifications,
    unreadCount,
    logout,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ledgerStatus, setLedgerStatus] = useState<{
    status: "ok" | "tampered" | "loading";
    count?: number;
    broken_seq?: number;
  }>({ status: "loading" });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function checkLedger() {
      try {
        const res = await apiFetch<{
          status: string;
          count?: number;
          broken_seq?: number;
        }>("/api/ledger/verify");
        if (res.status === "ok") {
          setLedgerStatus({ status: "ok", count: res.count });
        } else {
          setLedgerStatus({ status: "tampered", broken_seq: res.broken_seq });
        }
      } catch {
        setLedgerStatus({ status: "loading" });
      }
    }
    checkLedger();
  }, [pathname]);

  // Close menus on path change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  const roleHome = user ? `/${user.role}` : "/login";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-[#090d16] dark:text-slate-100">
      {/* Demo Notification Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f172a] px-4 py-2 text-xs text-slate-300">
        <div className="mx-auto flex flex-wrap items-center justify-center gap-2">
          <Badge variant="subtle" className="bg-slate-800 text-teal-400">
            DEMO MODE
          </Badge>
          <span>
            Synthetic environment with simulated escrow & local SHA-256 ledger.
          </span>
          <Link
            href="/how-it-works"
            className="text-teal-300 underline hover:text-teal-200"
          >
            How it works &rarr;
          </Link>
        </div>
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-slate-900 dark:text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm dark:bg-teal-500">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight">VOUCH</span>
              <span className="-mt-1 text-[10px] font-bold tracking-widest text-teal-600 dark:text-teal-400">
                PROVABLE WORK
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/how-it-works"
              className={`text-sm font-medium transition-colors hover:text-teal-600 dark:hover:text-teal-400 ${
                pathname === "/how-it-works"
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              How it works
            </Link>
            <Link
              href="/open-problems"
              className={`text-sm font-medium transition-colors hover:text-teal-600 dark:hover:text-teal-400 ${
                pathname === "/open-problems"
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Open problems
            </Link>
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors hover:text-teal-600 dark:hover:text-teal-400 ${
                pathname === "/pricing"
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Pricing & Split
            </Link>
            <Link
              href="/faq"
              className={`text-sm font-medium transition-colors hover:text-teal-600 dark:hover:text-teal-400 ${
                pathname === "/faq"
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              FAQ
            </Link>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Live Ledger Status Pill */}
            <div className="hidden sm:flex">
              {ledgerStatus.status === "ok" ? (
                <div
                  className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                  title="Cryptographic chain fully verified intact"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Ledger OK ({ledgerStatus.count} blocks)</span>
                </div>
              ) : ledgerStatus.status === "tampered" ? (
                <div
                  className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300"
                  title={`Chain broken at block #${ledgerStatus.broken_seq}`}
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                  <span>TAMPER AT #{ledgerStatus.broken_seq}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800">
                  <span>Checking diary...</span>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <ThemeToggle />

            {/* Authenticated user menu vs Login/Signup */}
            {user ? (
              <div className="relative flex items-center gap-2">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:w-96">
                      <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Notifications ({unreadCount} unread)
                        </span>
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-72 space-y-2 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "/notifications"}
                              onClick={() => {
                                if (!n.read) markNotificationRead(n.id);
                                setNotifOpen(false);
                              }}
                              className={`block rounded-xl p-2.5 text-xs transition hover:opacity-90 ${
                                !n.read
                                  ? "border border-teal-100 bg-teal-50/80 dark:border-teal-900 dark:bg-teal-950/40"
                                  : "bg-slate-50 dark:bg-slate-800/60"
                              }`}
                            >
                              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                                <span>{n.title}</span>
                                {!n.read && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                                )}
                              </div>
                              <div className="mt-0.5 text-slate-600 dark:text-slate-400">
                                {n.message}
                              </div>
                              <div className="mt-1 text-[10px] text-slate-400" suppressHydrationWarning>
                                {mounted ? new Date(n.created_at).toLocaleTimeString() : ""}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                      <div className="mt-2 border-t border-slate-100 pt-2 text-center dark:border-slate-800">
                        <Link
                          href="/notifications"
                          className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
                        >
                          View all notifications &rarr;
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Pill Link */}
                <Link
                  href={roleHome}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-xs font-black text-white dark:bg-teal-500">
                    {user.avatar_initials ||
                      user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden text-xs font-semibold text-slate-800 dark:text-slate-200 sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                  <Badge
                    variant="default"
                    className="h-5 px-1.5 text-[10px] uppercase font-bold"
                  >
                    {user.role}
                  </Badge>
                </Link>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={logout}
                  title="Log out"
                  className="rounded-xl"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 md:hidden dark:border-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:hidden">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/how-it-works"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                How it works
              </Link>
              <Link
                href="/open-problems"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Open problems
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Pricing & Fees
              </Link>
              <Link
                href="/faq"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                FAQ
              </Link>
              {user && (
                <>
                  <hr className="border-slate-200 dark:border-slate-800" />
                  <Link
                    href={roleHome}
                    className="text-sm font-bold text-teal-600 dark:text-teal-400"
                  >
                    My {user.role.toUpperCase()} Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Settings
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {children}
        <DemoGuide />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>VOUCH</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Work you can prove. Real milestones, locked rupee escrow, and
                peer reviews anchored to an immutable ledger.
              </p>
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                Built with Google Antigravity as an AI coding tool.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Platform
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="/how-it-works" className="hover:text-teal-600">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/open-problems" className="hover:text-teal-600">
                    Open Problems
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-teal-600">
                    Pricing & Rupee Split
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-teal-600">
                    About Architecture
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Roles
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="/students" className="hover:text-teal-600">
                    For Students
                  </Link>
                </li>
                <li>
                  <Link href="/experts" className="hover:text-teal-600">
                    For Experts
                  </Link>
                </li>
                <li>
                  <Link href="/companies" className="hover:text-teal-600">
                    For Companies
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-teal-600">
                    Demo Quick-Login (7 Roles)
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Trust & Verification
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="/terms" className="hover:text-teal-600">
                    Charter Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-teal-600">
                    Confidentiality Pledge
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-teal-600">
                    Contact Us (Logged to Ledger)
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-teal-600">
                    Demo Rehearsal Guide
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 dark:border-slate-800">
            &copy; 2026 VOUCH Platform. All synthetic demo data stored locally.
            No external trackers or dependencies.
          </div>
        </div>
      </footer>
    </div>
  );
}
