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
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="sponsor" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  Simulated Corporate Wallet &amp; Escrow Lockers
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Instant sandbox top-ups, per-milestone escrow locking, and immutable payment ledger audit receipts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleTopUp(50000)}
                  disabled={submittingTopup}
                  variant="outline"
                  className="text-xs font-bold"
                >
                  + Rs 50,000
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleTopUp(100000)}
                  disabled={submittingTopup}
                  className="text-xs font-bold gap-1"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>+ Rs 1,00,000 Top-Up</span>
                </Button>
              </div>
            </div>

            {/* Wallet Stat Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Card className="border-teal-500/30 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Available Balance</span>
                  <Coins className="h-5 w-5 text-teal-600" />
                </div>
                <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                  Rs {balance.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-slate-500">Ready to lock into upcoming milestones</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Active in Escrow</span>
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">
                  Rs {totalLocked.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-slate-500">Guaranteed to contributors upon delivery</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Released Payouts</span>
                  <Unlock className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  Rs {totalReleased.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-slate-500">Credited to student &amp; expert wallets</p>
              </Card>
            </div>

            {/* Active Lockers List */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-teal-600" />
                  <CardTitle className="text-base font-bold">Project Escrow Lockers</CardTitle>
                </div>
                <p className="text-xs text-slate-500">
                  Each locker holds funds exclusively for its milestone deliverable.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {lockers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No escrow lockers created yet.</p>
                ) : (
                  lockers.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {l.project_title}
                          </h4>
                          <Badge
                            variant={l.status === "funded" ? "default" : "subtle"}
                            className="capitalize text-[10px]"
                          >
                            {l.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          Locker ID: {l.id} {l.milestone_id ? `• Milestone: ${l.milestone_id}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                          Rs {l.amount.toLocaleString()}
                        </span>
                        <Button asChild size="sm" variant="outline" className="text-xs font-bold">
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
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-base font-bold">Ledger Top-Up Audit Receipts</CardTitle>
                </div>
                <p className="text-xs text-slate-500">
                  Every wallet balance increase is anchored as a WALLET_TOPUP block in the immutable chain.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {topups.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No recent top-up transactions recorded.</p>
                ) : (
                  topups.map((t) => (
                    <div
                      key={t.seq}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="subtle" className="font-mono text-[10px]">
                          Block #{t.seq}
                        </Badge>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          WALLET_TOPUP (+Rs {(t.amount || 0).toLocaleString()})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        <span>New Balance: Rs {(t.new_balance || 0).toLocaleString()}</span>
                        <span className="font-mono text-[10px] text-slate-400">{t.timestamp}</span>
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
