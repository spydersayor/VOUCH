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
  Sparkles,
  ArrowUp,
  Terminal,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CursorFollower } from "@/components/fx/CursorFollower";
import { triggerVerifyWave } from "@/components/fx/fx-config";

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
  const [scrolled, setScrolled] = useState(false);
  const [ledgerStatus, setLedgerStatus] = useState<{
    status: "ok" | "tampered" | "loading";
    count?: number;
    broken_seq?: number;
  }>({ status: "loading" });

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
          triggerVerifyWave("ok", undefined, res.count);
        } else {
          setLedgerStatus({ status: "tampered", broken_seq: res.broken_seq });
          triggerVerifyWave("tampered", res.broken_seq);
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const roleHome = user ? `/${user.role}` : "/login";

  return (
    <div className="flex min-h-screen flex-col bg-[#050508] text-[#f3f2ff] selection:bg-[#b9a9ff] selection:text-[#050508]">
      <CursorFollower />

      {/* Demo Notification Banner */}
      <div className="border-b border-white/[0.06] bg-[#0c0d12] px-4 py-2 text-xs font-mono text-[#8b8ea0]">
        <div className="mx-auto flex flex-wrap items-center justify-between max-w-7xl gap-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="uppercase tracking-widest text-[11px] text-violet-300 font-semibold">
              DEMO PROTOCOL ACTIVE
            </span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">
              Deterministic escrow sandbox & local SHA-256 cryptographic diary.
            </span>
          </div>
          <Link
            href="/how-it-works"
            className="text-violet-300 hover:text-white underline tracking-wider transition-colors"
          >
            Protocol Spec &rarr;
          </Link>
        </div>
      </div>

      {/* Top Navbar */}
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-white/[0.08] bg-[#050508]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
            : "border-white/[0.04] bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* VOUCH Wordmark Left */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-900/80 via-[#181232] to-violet-950 border border-violet-400/40 text-violet-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] group-hover:border-violet-300 transition-all">
              <Shield className="h-4 w-4 text-violet-300 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white font-mono">
                VOUCH
              </span>
              <span className="-mt-1 text-[9px] font-mono tracking-[0.2em] text-violet-400 uppercase font-semibold">
                PROOF LEDGER
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (dimmed inactive links) */}
          <nav className="hidden items-center gap-7 md:flex font-mono text-xs tracking-wider uppercase">
            {[
              { href: "/", label: "Home" },
              { href: "/how-it-works", label: "How It Works" },
              { href: "/pricing", label: "Models" },
              { href: "/open-problems", label: "Open Problems" },
              { href: "/#ledger-verifier", label: "Ledger" },
              { href: "/help", label: "Rehearse" },
            ].map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors duration-200 hover:text-white ${
                    isActive ? "text-white font-bold" : "text-[#8b8ea0]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Live Ledger Status Pill */}
            <div className="hidden sm:flex">
              {ledgerStatus.status === "ok" ? (
                <div
                  className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/30 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  title="Cryptographic chain fully verified intact"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  <span>LEDGER OK ({ledgerStatus.count})</span>
                </div>
              ) : ledgerStatus.status === "tampered" ? (
                <div
                  className="flex items-center gap-2 rounded-full border border-rose-500/50 bg-rose-950/40 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
                  title={`Chain broken at block #${ledgerStatus.broken_seq}`}
                >
                  <AlertTriangle className="h-3 w-3 text-rose-400" />
                  <span>TAMPER AT #{ledgerStatus.broken_seq}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono text-slate-400">
                  <span className="h-1 w-1 rounded-full bg-slate-400 animate-ping" />
                  <span>Auditing...</span>
                </div>
              )}
            </div>

            {/* Authenticated user menu vs Start a project / Login */}
            {user ? (
              <div className="relative flex items-center gap-2">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0c0d12] text-slate-300 transition hover:border-violet-400/50 hover:text-white"
                    aria-label="Notifications"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/10 bg-[#0c0d12] p-3.5 shadow-2xl backdrop-blur-xl sm:w-96 animate-fade-up">
                      <div className="mb-2.5 flex items-center justify-between border-b border-white/[0.06] pb-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8b8ea0]">
                          Notifications ({unreadCount})
                        </span>
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-[11px] font-mono font-semibold text-violet-300 hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500 font-mono">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "/notifications"}
                              onClick={() => markNotificationRead(n.id)}
                              className={`block rounded-xl border p-2.5 text-xs transition ${
                                n.read
                                  ? "border-white/[0.04] bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                                  : "border-violet-400/30 bg-violet-950/20 text-slate-200 hover:bg-violet-950/30"
                              }`}
                            >
                              <div className="flex items-center justify-between font-mono text-[10px] uppercase text-violet-300">
                                <span>{n.title}</span>
                                {!n.read && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#c4b5fd]" />
                                )}
                              </div>
                              <div className="mt-1 text-slate-300 leading-snug">
                                {n.message}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="mt-2.5 border-t border-white/[0.06] pt-2 text-center">
                        <Link
                          href="/notifications"
                          className="text-[11px] font-mono text-violet-300 hover:underline tracking-wider uppercase font-semibold"
                        >
                          View all ledger events &rarr;
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Pill Link */}
                <Link
                  href={roleHome}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase text-white hover:border-violet-400/50 hover:bg-violet-950/30 transition shadow-sm"
                >
                  <User className="h-3 w-3 text-violet-400" />
                  <span>{user.role}</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-transparent text-slate-400 hover:border-rose-400/40 hover:text-rose-400 transition"
                  title="Log out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white transition-colors px-3 py-1.5"
                >
                  Login
                </Link>

                <Link
                  href="/open-problems"
                  className="group relative inline-flex items-center justify-center h-9 px-4 sm:px-5 rounded-full bg-gradient-to-r from-violet-950 via-[#120d26] to-slate-950 text-xs font-mono tracking-wider uppercase font-semibold text-white border border-violet-400/50 hover:border-violet-300 shadow-[0_0_14px_rgba(168,85,247,0.3)] hover:shadow-[0_0_24px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-violet-300" />
                    <span>START A PROJECT</span>
                  </span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0c0d12] text-slate-300 hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="border-b border-white/10 bg-[#050508]/98 px-6 py-6 backdrop-blur-2xl md:hidden animate-fade-up">
            <nav className="flex flex-col space-y-4 font-mono text-xs uppercase tracking-widest text-[#8b8ea0]">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/pricing" className="hover:text-white transition-colors">
                Engagement Models & Split
              </Link>
              <Link href="/open-problems" className="hover:text-white transition-colors">
                Open Problems
              </Link>
              <Link href="/#ledger-verifier" className="hover:text-white transition-colors">
                Live Diary Verifier
              </Link>
              <Link href="/help" className="hover:text-white transition-colors">
                Rehearsal Sandbox
              </Link>
              {user && (
                <div className="pt-4 border-t border-white/10 flex flex-col space-y-3">
                  <Link href={roleHome} className="text-violet-300 font-bold">
                    My {user.role.toUpperCase()} Dashboard
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full">{children}</main>

      {/* Giant VOUCH Display Footer */}
      <footer className="relative border-t border-white/[0.08] bg-[#050508] pt-20 pb-12 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Giant VOUCH Wordmark Header */}
          <div className="w-full flex flex-col items-start border-b border-white/[0.08] pb-10">
            <div className="text-6xl sm:text-8xl lg:text-9xl font-extralight tracking-tight text-white/95 leading-none select-none">
              VOUCH
            </div>
            <p className="mt-4 text-xs font-mono uppercase tracking-[0.2em] text-[#8b8ea0]">
              Proof-First Collaboration Protocol · Cryptographic Receipts
            </p>
          </div>

          {/* Footer Multi-Column Grid */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 font-mono text-xs">
            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white font-semibold block">
                Navigate
              </span>
              <ul className="space-y-2 text-[#8b8ea0]">
                <li><Link href="/" className="hover:text-violet-300 transition-colors">Home</Link></li>
                <li><Link href="/how-it-works" className="hover:text-violet-300 transition-colors">Protocol (How It Works)</Link></li>
                <li><Link href="/open-problems" className="hover:text-violet-300 transition-colors">Open Problems</Link></li>
                <li><Link href="/pricing" className="hover:text-violet-300 transition-colors">Pricing & 0% Student Fee</Link></li>
                <li><Link href="/about" className="hover:text-violet-300 transition-colors">System Architecture</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white font-semibold block">
                Roles & Portals
              </span>
              <ul className="space-y-2 text-[#8b8ea0]">
                <li><Link href="/students" className="hover:text-violet-300 transition-colors">Student Talent</Link></li>
                <li><Link href="/experts" className="hover:text-violet-300 transition-colors">Co-signing Experts</Link></li>
                <li><Link href="/companies" className="hover:text-violet-300 transition-colors">Enterprise Sponsors</Link></li>
                <li><Link href="/login" className="hover:text-violet-300 transition-colors">Quick Login (7 Roles)</Link></li>
                <li><Link href="/admin" className="hover:text-violet-300 transition-colors">Governance & Tamper Sim</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white font-semibold block">
                Verification & Trust
              </span>
              <ul className="space-y-2 text-[#8b8ea0]">
                <li><Link href="/terms" className="hover:text-violet-300 transition-colors">Charter Terms (NDAs)</Link></li>
                <li><Link href="/privacy" className="hover:text-violet-300 transition-colors">Confidentiality Rules</Link></li>
                <li><Link href="/help" className="hover:text-violet-300 transition-colors">Rehearsal Engine Manual</Link></li>
                <li><Link href="/contact" className="hover:text-violet-300 transition-colors">Contact (Ledger Logged)</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white font-semibold block">
                Engineering
              </span>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Built with Google Antigravity as an advanced agentic pair programmer. Engineered for strict local offline execution.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-violet-400/30 bg-violet-950/20 text-[10px] text-violet-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>SHA-256 Verified Sandbox</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Honest Disclaimer & Back to Top */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06] text-xs font-mono text-[#8b8ea0]">
            <span>
              © 2026 VOUCH Platform · Prototype. All payments, escrows and KYC are simulated locally.
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
            >
              <span>Back to the top</span>
              <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
