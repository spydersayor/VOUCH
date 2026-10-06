"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Coins,
  Lock,
  Unlock,
  PlusCircle,
  ShieldCheck,
  ArrowUpRight,
  History,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface LockerItem {
  id: string;
  project_id: string;
  project_title: string;
  milestone_id: string;
  amount: number;
  status: string;
  funded_at: string;
  released_at?: string | null;
}

export default function SponsorWalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [totalLocked, setTotalLocked] = useState<number>(0);
  const [totalReleased, setTotalReleased] = useState<number>(0);
  const [lockers, setLockers] = useState<LockerItem[]>([]);
  const [topups, setTopups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Top up modal / input state
  const [topupAmount, setTopupAmount] = useState<number>(100000);
  const [submittingTopup, setSubmittingTopup] = useState(false);

  const loadWallet = async () => {
    try {
      const res = await apiFetch<any>("/api/sponsor/wallet");
      setBalance(res.balance || 0);
      setTotalLocked(res.total_locked || 0);
      setTotalReleased(res.total_released || 0);
      setLockers(res.lockers || []);
      setTopups(res.topups || []);
    } catch (err: any) {
      toast.error("Failed to load wallet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleTopUp = async (amountToFund: number) => {
    if (amountToFund <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    setSubmittingTopup(true);
    try {
      const res = await apiFetch<any>("/api/sponsor/wallet/top-up", {
        method: "POST",
        body: JSON.stringify({ amount: Math.floor(amountToFund) }),
      });
      toast.success(`Rs ${amountToFund.toLocaleString()} credited to simulated wallet!`);
      loadWallet();
    } catch (err: any) {
      toast.error(err.message || "Top-up failed");
    } finally {
      setSubmittingTopup(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["sponsor", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)] bg-[#050508] text-white">
        <RoleSidebar role="sponsor" />
        <main className="flex-1 p-6 md:p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-[11px] font-mono text-[#b9a9ff] mb-2">
                  <Wallet className="h-3 w-3" />
                  TREASURY & ESCROW
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Corporate Wallet &amp; Escrow Lockers
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Instant sandbox top-ups, per-milestone escrow locking, and immutable payment ledger audit receipts.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  onClick={() => handleTopUp(50000)}
                  disabled={submittingTopup}
                  variant="outline"
                  className="text-xs font-mono border-white/10 hover:border-violet-500/30 hover:bg-white/[0.04] text-zinc-300"
                >
                  + Rs 50,000
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleTopUp(100000)}
                  disabled={submittingTopup}
                  className="text-xs font-bold gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/20 border border-violet-400/30"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>+ Rs 1,00,000 Top-Up</span>
                </Button>
              </div>
            </div>

            {/* Wallet Stat Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md p-6 relative overflow-hidden group hover:border-violet-500/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">Available Balance</span>
                  <div className="p-2 rounded-lg bg-violet-500/10 text-[#b9a9ff] border border-violet-500/20">
                    <Coins className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-bold tracking-tight text-white font-mono">
                  Rs {balance.toLocaleString()}
                </div>
                <p className="mt-2 text-xs text-zinc-500">Ready to lock into upcoming milestones</p>
              </Card>

              <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">Active in Escrow</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Lock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-bold tracking-tight text-amber-400 font-mono">
                  Rs {totalLocked.toLocaleString()}
                </div>
                <p className="mt-2 text-xs text-zinc-500">Guaranteed to contributors upon delivery</p>
              </Card>

              <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400">Released Payouts</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Unlock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-3xl font-bold tracking-tight text-emerald-400 font-mono">
                  Rs {totalReleased.toLocaleString()}
                </div>
                <p className="mt-2 text-xs text-zinc-500">Credited to student &amp; expert wallets</p>
              </Card>
            </div>

            {/* Active Lockers List */}
            <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-violet-500/10 text-[#b9a9ff]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white">Project Escrow Lockers</CardTitle>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Each locker holds funds exclusively for its milestone deliverable.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {lockers.length === 0 ? (
                  <div className="py-8 text-center rounded-xl border border-dashed border-white/[0.08]">
                    <p className="text-xs text-zinc-500 font-mono">No escrow lockers created yet.</p>
                  </div>
                ) : (
                  lockers.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.06] bg-[#121218]/60 p-4 transition hover:border-violet-500/20 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-white">
                            {l.project_title}
                          </h4>
                          <Badge
                            variant={l.status === "funded" ? "default" : "subtle"}
                            className="capitalize text-[10px] font-mono"
                          >
                            {l.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono">
                          Locker ID: <span className="text-zinc-400">{l.id}</span> {l.milestone_id ? `• Milestone: ${l.milestone_id}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="text-emerald-400 font-mono text-sm">
                          Rs {l.amount.toLocaleString()}
                        </span>
                        <Button asChild size="sm" variant="outline" className="text-xs font-medium border-white/10 hover:border-violet-500/30 hover:bg-white/[0.04]">
                          <Link href={`/sponsor/projects/${l.project_id}`}>
                            <span>View Initiative</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Ledger Top-up Receipts */}
            <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white">Ledger Top-Up Audit Receipts</CardTitle>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Every wallet balance increase is anchored as a WALLET_TOPUP block in the immutable chain.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-2.5">
                {topups.length === 0 ? (
                  <div className="py-8 text-center rounded-xl border border-dashed border-white/[0.08]">
                    <p className="text-xs text-zinc-500 font-mono">No recent top-up transactions recorded.</p>
                  </div>
                ) : (
                  topups.map((t) => (
                    <div
                      key={t.seq}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#121218]/40 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Badge variant="subtle" className="font-mono text-[10px] bg-violet-500/10 border-violet-500/20 text-[#b9a9ff]">
                          Block #{t.seq}
                        </Badge>
                        <span className="font-mono font-medium text-zinc-200">
                          WALLET_TOPUP <span className="text-emerald-400">(+Rs {(t.amount || 0).toLocaleString()})</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
                        <span>New Balance: <span className="font-mono text-zinc-200">Rs {(t.new_balance || 0).toLocaleString()}</span></span>
                        <span className="font-mono text-[10px] text-zinc-500">{t.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
