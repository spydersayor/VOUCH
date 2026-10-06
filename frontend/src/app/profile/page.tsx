"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/utils";
import { ProsConsPanel } from "@/components/pros-cons/ProsConsPanel";
import {
  Award,
  ShieldCheck,
  Star,
  Clock,
  Wallet,
  Building2,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { RoleSidebar } from "@/components/shell/RoleSidebar";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await apiFetch<any>(`/api/users/${user.id}/public`);
      setProfile(data);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please log in to view your provable profile and credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Log In to Demo Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const {
    name,
    role,
    headline,
    avatar_initials,
    skills = [],
    newbie_badge,
    stars,
    company_record,
    pros_cons_data,
    certificates = [],
    closed_projects = [],
    rating_timeline = [],
    wallet_balance = 0,
    email,
  } = profile || {};

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <RoleSidebar role={user.role as any} />
      <main className="flex-1 p-6 md:p-8 animate-fade-up">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Profile Header */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-600 text-2xl font-black text-white shadow-md dark:bg-teal-500">
                  {avatar_initials || name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl">
                      {name}
                    </h1>
                    <Badge variant="outline" className="uppercase font-bold text-[10px]">
                      {role}
                    </Badge>
                    {newbie_badge ? (
                      <Badge variant="newbie" className="gap-1 font-bold">
                        <Sparkles className="h-3 w-3" />
                        NEWBIE BADGE
                      </Badge>
                    ) : (
                      <Badge variant="gold" className="gap-1 font-bold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                        {stars || "4.5"} ⭐
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {headline || "Verified VOUCH Contributor"}
                  </p>
                  <p className="text-xs font-mono text-slate-400">
                    ID: {user.id} • {email}
                  </p>
                </div>
              </div>

              {/* Private wallet summary */}
              <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 dark:border-teal-900/60 dark:bg-teal-950/20 sm:text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  Simulated Wallet Balance
                </div>
                <div className="mt-0.5 text-2xl font-black text-teal-700 dark:text-teal-300">
                  {formatRupees(wallet_balance)}
                </div>
                <div className="mt-1 text-[10px] text-teal-600 dark:text-teal-400">
                  100% Escrow Guaranteed
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Verified Technical Competencies
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((s: string) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-lg border border-teal-500/20 bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-200"
                  >
                    <CheckCircle2 className="h-3 w-3 text-teal-600" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* "Why did my rating change?" Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-teal-600" />
                  <span>Why Did My Rating Change?</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Immutable audit trail of review scores, penalty adjustments, and Newbie graduation events.
                </CardDescription>
              </div>
              <Badge variant="subtle" className="font-mono text-[10px]">
                {rating_timeline.length} Recorded Change(s)
              </Badge>
            </CardHeader>
            <CardContent>
              {rating_timeline.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {newbie_badge
                    ? "Newbie badge active. Initial star rating will be established upon completing your first project with a closed review."
                    : "No rating adjustments recorded yet."}
                </div>
              ) : (
                <div className="space-y-3">
                  {rating_timeline.map((item: any, idx: number) => {
                    const isPositive = item.delta > 0;
                    const isNegative = item.delta < 0;
                    return (
                      <div
                        key={item.id || idx}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                            {isPositive && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                            {isNegative && <TrendingDown className="h-4 w-4 text-rose-500" />}
                            <span>{item.reason}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                            <span>
                              {item.old_rating ? `${item.old_rating} ⭐` : "Newbie"} &rarr;{" "}
                              <strong className="text-slate-700 dark:text-slate-300">
                                {item.new_rating} ⭐
                              </strong>
                            </span>
                            {item.ledger_seq && (
                              <Link
                                href="/projects/proj_retinopathy/timeline"
                                className="text-teal-600 hover:underline dark:text-teal-400"
                              >
                                Ledger Seq #{item.ledger_seq}
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <Badge
                            variant={isPositive ? "default" : isNegative ? "destructive" : "outline"}
                            className="font-mono text-xs"
                          >
                            {item.delta > 0 ? `+${item.delta}` : item.delta} ⭐
                          </Badge>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Record if Sponsor */}
          {company_record && (
            <Card className="border-teal-200/80 bg-gradient-to-br from-white to-teal-50/30 dark:border-teal-900/60 dark:from-slate-900 dark:to-teal-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-teal-800 dark:text-teal-200">
                  <Building2 className="h-5 w-5" />
                  <span>Company Record &amp; Sponsor Reliability</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Track record metrics compiled from closed student milestones and escrow ledger receipts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      On-Time Payment
                    </div>
                    <div className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {company_record.on_time_payment_rate || "100%"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Dispute Count
                    </div>
                    <div className="mt-1 text-lg font-black text-slate-800 dark:text-slate-200">
                      {company_record.dispute_count || 0}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Withdrawals Count
                    </div>
                    <div className={`mt-1 text-lg font-black ${company_record.withdrawals > 0 ? "text-rose-600" : "text-slate-800 dark:text-slate-200"}`}>
                      {company_record.withdrawals || 0}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Benefit Score
                    </div>
                    <div className="mt-1 text-lg font-black text-teal-600 dark:text-teal-400">
                      {company_record.past_contributor_benefit_score || "4.9 / 5.0"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pros and Cons Panel (SPEC Section 7) */}
          {pros_cons_data && (
            <ProsConsPanel
              data={pros_cons_data}
              candidateId={user.id}
              candidateName={user.name}
              title="Verified Track Record Insights"
              onReplyAdded={loadProfile}
            />
          )}

          {/* Verified Certificates & Credentials */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  <span>Provable Certificates &amp; Credit Records</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Cryptographically anchored deliverables, co-authorship credentials, and completion records.
                </CardDescription>
              </div>
              <Badge variant="subtle" className="text-[10px]">
                {certificates.length} Issued
              </Badge>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No verified milestone credentials issued yet. Deliver accepted milestones to earn provable credentials.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {certificates.map((cert: any) => (
                    <div
                      key={cert.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            cert.certificate_type === "completion_certificate"
                              ? "gold"
                              : cert.certificate_type === "co_authorship"
                              ? "default"
                              : "subtle"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {cert.certificate_type.replace(/_/g, " ")}
                        </Badge>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(cert.issued_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                        {cert.title}
                      </div>
                      <div className="mt-1 text-slate-500 font-medium">
                        {cert.project_title || "Verified Project Initiative"}
                      </div>
                      <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-teal-600 dark:text-teal-400">
                        <span>Ref: {cert.ledger_ref}</span>
                        <Link
                          href="/projects/proj_retinopathy/timeline"
                          className="hover:underline flex items-center gap-1 font-sans"
                        >
                          Verify Receipt <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Closed Projects Portfolio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-teal-600" />
                <span>Closed Projects &amp; Verified Outcomes</span>
              </CardTitle>
              <CardDescription className="text-xs">
                History of completed engagements with verified deliverable summaries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {closed_projects.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No completed projects on record yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {closed_projects.map((p: any) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-slate-200 p-4 text-xs dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                        <span className="text-sm">{p.title}</span>
                        <span className="text-teal-600 dark:text-teal-400 font-mono">
                          {p.budget > 0 ? formatRupees(p.budget) : "Knowledge-Sharing"}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-500">{p.public_summary}</p>
                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <Badge variant="subtle" className="text-[10px]">
                          STATUS: CLOSED &amp; VERIFIED
                        </Badge>
                        <Link
                          href={`/charters/${p.id}`}
                          className="font-semibold text-teal-600 hover:underline dark:text-teal-400"
                        >
                          View Charter &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
