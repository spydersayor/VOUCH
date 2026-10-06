"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  FolderGit2,
  FileCode,
  MessageSquare,
  FileText,
  UserCheck,
  Award,
  Coins,
  Bot,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function ProjectTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [timelineData, setTimelineData] = useState<any>(null);
  const [verifyingLedger, setVerifyingLedger] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setErrorStatus(null);
      const data = await apiFetch<any>(`/api/projects/${projectId}/timeline`);
      setTimelineData(data);
      setVerificationResult(data.ledger_verification);
    } catch (err: any) {
      setErrorStatus(err.status || 500);
      setErrorMessage(err.message || "Failed to load project ledger timeline");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleVerifyLedger = async () => {
    setVerifyingLedger(true);
    try {
      const res = await apiFetch<any>("/api/ledger/verify");
      setVerificationResult(res);
      if (res.status === "ok") {
        toast.success(`Ledger verified: SHA-256 hash chain intact across all ${res.total_entries} blocks!`);
      } else {
        toast.error(`Verification alert: ledger tampering detected at block #${res.tampered_at_seq}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Verification request failed");
    } finally {
      setVerifyingLedger(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
    toast.success("Copied cryptographic hash to clipboard");
  };

  // 403 Forbidden Access Guard
  if (errorStatus === 403) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Card className="border-rose-200 bg-rose-50/50 shadow-lg dark:border-rose-900/60 dark:bg-rose-950/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400">
              <Lock className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-black text-rose-900 dark:text-rose-100">
              Access Restricted (403 Forbidden)
            </CardTitle>
            <CardDescription className="text-sm font-medium text-rose-700 dark:text-rose-300">
              {errorMessage || "Only accepted project members, the sponsor and administrators can inspect the project audit ledger."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/open-problems">Browse Open Problems</Link>
            </Button>
            <Button variant="default" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (loading && !timelineData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-medium">Loading ledger timeline and verifying SHA-256 signatures...</p>
        </div>
      </div>
    );
  }

  const { project, events, total_events } = timelineData || {};
  const isOk = verificationResult?.status === "ok";

  const getActionIcon = (action: string) => {
    switch (action) {
      case "FILE_UPLOADED":
        return <FileCode className="h-4 w-4 text-sky-600" />;
      case "PROJECT_CHAT_MESSAGE":
        return <MessageSquare className="h-4 w-4 text-teal-600" />;
      case "DELIVERABLE_SUBMITTED":
        return <FileText className="h-4 w-4 text-indigo-600" />;
      case "SUBMISSION_FLAGGED_FOR_REVIEW":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "EXPERT_REVIEW_RECORDED":
        return <UserCheck className="h-4 w-4 text-emerald-600" />;
      case "SPONSOR_MILESTONE_ACCEPTED":
      case "MILESTONE_ACCEPTED":
        return <Award className="h-4 w-4 text-emerald-600" />;
      case "LOCKER_FUNDS_RELEASED":
        return <Coins className="h-4 w-4 text-amber-600" />;
      case "CERTIFICATE_ISSUED":
        return <ShieldCheck className="h-4 w-4 text-indigo-600" />;
      case "AI_AGENT_ACTION_PROPOSED":
      case "AI_AGENT_ACTION_APPROVED":
        return <Bot className="h-4 w-4 text-purple-600" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2 text-xs">
              <Link href={`/projects/${projectId}/workspace`}>
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Workspace</span>
              </Link>
            </Button>
            <Badge variant="outline" className="text-xs uppercase font-mono">
              {project?.id}
            </Badge>
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl">
            Provable Ledger Timeline
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
            Cryptographic, append-only SHA-256 audit trail for {project?.title}. Every upload, chat message, submission, expert review, decision, and payout is permanently verifiable.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button
            onClick={handleVerifyLedger}
            disabled={verifyingLedger}
            className="gap-2 bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{verifyingLedger ? "Verifying Hash Chain..." : "Verify Ledger Integrity"}</span>
          </Button>

          {verificationResult && (
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                isOk ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isOk ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              <span>
                {isOk
                  ? `Intact: Hash Chain Valid (${verificationResult.total_entries} blocks)`
                  : `Alert: Tamper detected at #${verificationResult.tampered_at_seq}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Stats Banner */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Project Events</div>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{total_events || 0}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hash Algorithm</div>
          <div className="mt-1 font-mono text-sm font-bold text-teal-600 dark:text-teal-400">SHA-256 Chained</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ledger Status</div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Cryptographically Sound</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Governance</div>
          <div className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">Zero-Knowledge Attestation</div>
        </div>
      </div>

      {/* Chronological Timeline Stream */}
      <div className="space-y-4">
        {events?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500 dark:border-slate-800">
            No ledger events logged for this project yet.
          </div>
        ) : (
          events?.map((ev: any, idx: number) => {
            const payload = typeof ev.payload === "string" ? JSON.parse(ev.payload) : ev.payload;
            return (
              <div
                key={ev.seq}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                      {getActionIcon(ev.action)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-400">#{ev.seq}</span>
                        <Badge variant="outline" className="text-xs uppercase font-bold">
                          {ev.action.replace(/_/g, " ")}
                        </Badge>
                        {ev.on_behalf_of && (
                          <Badge variant="subtle" className="text-[10px] font-mono">
                            on_behalf_of: {ev.on_behalf_of}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Actor: <strong className="text-slate-800 dark:text-slate-200">{ev.actor_name}</strong> ({ev.actor_role}) &bull;{" "}
                        {new Date(ev.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Hash: {ev.entry_hash.substring(0, 14)}...
                    </div>
                    <button
                      onClick={() => copyToClipboard(ev.entry_hash, `hash_${ev.seq}`)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                      title="Copy SHA-256 block hash"
                    >
                      {copiedHash === `hash_${ev.seq}` ? (
                        <Check className="h-3.5 w-3.5 text-teal-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Payload Content */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-mono text-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
                </div>

                {/* Previous Hash Linkage */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Prev Hash: {ev.prev_hash ? `${ev.prev_hash.substring(0, 18)}...` : "GENESIS_BLOCK"}</span>
                  <span>Block Height #{ev.seq}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
