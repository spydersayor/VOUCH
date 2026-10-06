"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { Shield, CheckCircle2, AlertTriangle, ArrowRight, Zap, RefreshCw } from "lucide-react";

export default function HomePage() {
  const [ledger, setLedger] = useState<{
    status: string;
    count?: number;
    head_hash?: string;
    broken_seq?: number;
    reason?: string;
  }>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);

  const fetchLedger = async () => {
    setRefreshing(true);
    try {
      const data = await apiFetch<any>("/api/ledger/verify");
      setLedger(data);
    } catch (e: any) {
      setLedger({ status: "error", reason: e.message });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mx-auto max-w-4xl text-center py-12">
        <Badge variant="default" className="mb-4 text-xs font-bold tracking-widest">
          PROOF OVER PROMISES
        </Badge>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          Work you can <span className="text-teal-600 dark:text-teal-400 underline decoration-teal-300">prove</span>.
        </h1>
        <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 sm:text-xl leading-relaxed">
          The trust-first collaboration platform where student contributions unlock real milestone payouts,
          expert mentorship is credited, and every review is cryptographically anchored to an immutable ledger.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/open-problems">
              <span>Explore Open Problems</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/login">
              <Zap className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>One-Click Quick Login</span>
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/how-it-works">How It Works</Link>
          </Button>
        </div>
      </section>

      {/* Live Verifier Widget */}
      <section className="my-10 rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/50 via-white to-teal-50/20 p-8 shadow-sm dark:border-teal-900/60 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm dark:bg-teal-500">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Live Platform Ledger Diary
                </h2>
                <Badge variant="verified">SHA-256 Chained</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directly audits each sequential block recorded in the local SQLite ledger.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLedger}
            disabled={refreshing}
            className="rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>Re-verify Chain</span>
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 font-mono text-xs shadow-inner dark:border-slate-800 dark:bg-slate-950">
          {ledger.status === "ok" ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>CRYPTOGRAPHIC INTEGRITY VERIFIED (OK)</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                <strong>Sequential Blocks:</strong> {ledger.count} verified blocks
              </div>
              <div className="truncate text-slate-500 dark:text-slate-500">
                <strong>Head Entry Hash:</strong> {ledger.head_hash || "Genesis"}
              </div>
            </div>
          ) : ledger.status === "tampered" ? (
            <div className="space-y-1.5 text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-2 text-sm font-bold">
                <AlertTriangle className="h-4 w-4" />
                <span>INTEGRITY FAILURE: BROKEN AT ENTRY #{ledger.broken_seq}</span>
              </div>
              <div>{ledger.reason}</div>
            </div>
          ) : (
            <div className="text-slate-400">Auditing cryptographic chain...</div>
          )}
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="border-t-4 border-t-teal-600">
          <CardHeader>
            <Badge variant="default" className="w-fit">STUDENTS</Badge>
            <CardTitle className="mt-2 text-lg">Work You Can Prove</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            Earn fair rupee milestone compensation with Newbie badge boost and transparent receipts on the ledger.
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-rose-500">
          <CardHeader>
            <Badge variant="flagged" className="w-fit">EXPERTS</Badge>
            <CardTitle className="mt-2 text-lg">Mentorship with Attribution</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            Guide student architectures, review code integrity, declare conflicts transparently, and earn 30% advisory shares.
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-slate-900 dark:border-t-slate-100">
          <CardHeader>
            <Badge variant="subtle" className="w-fit">SPONSORS</Badge>
            <CardTitle className="mt-2 text-lg">De-Risk R&D Initiatives</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">
            Gated confidential briefs and datasets, automated escrow lockers, and candidates ranked by verified closed projects.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
