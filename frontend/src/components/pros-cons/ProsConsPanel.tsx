"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  MessageSquare,
  Send,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export interface EvidenceItem {
  project?: string;
  review_count?: number;
  metric_score?: number | null;
  ledger_ref?: string;
}

export interface ProConBullet {
  key: string;
  text: string;
  type: "pro" | "con";
  evidence?: EvidenceItem;
  reply?: {
    text: string;
    created_at?: string;
    ledger_ref?: string;
  };
}

export interface ProsConsData {
  is_newbie?: boolean;
  newbie_message?: string | null;
  limited_data?: boolean;
  closed_projects_count?: number;
  pros: ProConBullet[];
  cons: ProConBullet[];
}

interface Props {
  data: ProsConsData;
  candidateId?: string;
  candidateName?: string;
  title?: string;
  onReplyAdded?: () => void;
}

export function ProsConsPanel({
  data,
  candidateId,
  candidateName,
  title = "Track Record & Verification",
  onReplyAdded,
}: Props) {
  const { user } = useAuth();
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [replyOpenKey, setReplyOpenKey] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canReply = user && (user.id === candidateId || user.role === "admin");

  const handlePostReply = async (conKey: string) => {
    if (!replyText.trim() || !candidateId) return;
    setSubmittingReply(true);
    try {
      await apiFetch(`/api/users/${candidateId}/con-reply`, {
        method: "POST",
        body: JSON.stringify({
          con_key: conKey,
          reply_text: replyText.trim(),
        }),
      });
      toast.success("Public reply anchored to immutable ledger!");
      setReplyOpenKey(null);
      setReplyText("");
      if (onReplyAdded) onReplyAdded();
    } catch (err: any) {
      toast.error(err.message || "Failed to post reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {data.is_newbie && (
            <Badge variant="subtle" className="gap-1 border-teal-500/30 text-teal-700 dark:text-teal-300">
              <Sparkles className="h-3 w-3" />
              Newbie Profile
            </Badge>
          )}
          {data.limited_data && !data.is_newbie && (
            <Badge variant="subtle" className="gap-1 border-amber-500/30 text-amber-700 dark:text-amber-300">
              <ShieldAlert className="h-3 w-3" />
              Limited Data (&lt; 2 closed projects)
            </Badge>
          )}
        </div>
      </div>

      {data.is_newbie && data.newbie_message && (
        <div className="mb-3 rounded-lg border border-teal-500/20 bg-teal-500/10 p-2.5 text-xs text-teal-800 dark:text-teal-200">
          <p className="font-semibold">{data.newbie_message}</p>
          <p className="mt-0.5 text-[11px] opacity-80">
            Verified academic credentials and skill milestones shown below with zero adverse flags.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {/* Strengths (Pros) */}
        {data.pros.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Strengths ({data.pros.length})
            </span>
            <div className="space-y-1.5">
              {data.pros.map((p) => {
                const isExpanded = !!expandedKeys[p.key];
                return (
                  <div
                    key={p.key}
                    className="rounded-lg border border-emerald-500/20 bg-emerald-50/50 p-2 text-xs transition-all dark:bg-emerald-950/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {p.text}
                        </span>
                      </div>
                      {p.evidence && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(p.key)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
                        >
                          <span>Evidence</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {isExpanded && p.evidence && (
                      <div className="mt-2 rounded border border-emerald-500/20 bg-white/70 p-2 text-[11px] dark:bg-slate-900/60">
                        <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Verified Source:
                            </span>{" "}
                            {p.evidence.project || "Platform Closed Project"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Reviews:
                            </span>{" "}
                            {p.evidence.review_count || 1} evaluations
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                          <FileCheck className="h-3 w-3 text-emerald-600" />
                          <span className="font-mono">Ledger Ref: {p.evidence.ledger_ref}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Watch-outs (Cons) */}
        {data.cons.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Watch-outs ({data.cons.length})
            </span>
            <div className="space-y-2">
              {data.cons.map((c) => {
                const isExpanded = !!expandedKeys[c.key];
                const isReplying = replyOpenKey === c.key;
                return (
                  <div
                    key={c.key}
                    className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-2.5 text-xs dark:bg-amber-950/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {c.text}
                        </span>
                      </div>
                      {c.evidence && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(c.key)}
                          className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:underline dark:text-amber-300"
                        >
                          <span>Evidence</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {isExpanded && c.evidence && (
                      <div className="mt-2 rounded border border-amber-500/20 bg-white/70 p-2 text-[11px] dark:bg-slate-900/60">
                        <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Historical Project:
                            </span>{" "}
                            {c.evidence.project || "Past Engagement"}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Criterion Score:
                            </span>{" "}
                            {c.evidence.metric_score ?? "N/A"}/5.0
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                          <FileCheck className="h-3 w-3 text-amber-600" />
                          <span className="font-mono">Ledger Audit: {c.evidence.ledger_ref}</span>
                        </div>
                      </div>
                    )}

                    {/* Candidate Public Reply */}
                    {c.reply ? (
                      <div className="mt-2.5 rounded-md border border-slate-200 bg-white p-2 text-[11px] dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <MessageSquare className="h-3 w-3 text-teal-600" />
                          <span>Candidate Public Reply:</span>
                        </div>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">
                          &quot;{c.reply.text}&quot;
                        </p>
                      </div>
                    ) : (
                      canReply && (
                        <div className="mt-2 pt-1">
                          {isReplying ? (
                            <div className="space-y-2 rounded border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                Post a public explanation anchored to ledger:
                              </label>
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Explain context or how this was resolved..."
                                rows={2}
                                className="w-full rounded border border-slate-300 p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setReplyOpenKey(null)}
                                  className="h-7 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={submittingReply || !replyText.trim()}
                                  onClick={() => handlePostReply(c.key)}
                                  className="h-7 gap-1 text-xs"
                                >
                                  <Send className="h-3 w-3" />
                                  <span>Publish Reply</span>
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyOpenKey(c.key);
                                setReplyText("");
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:underline dark:text-teal-400"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Add public reply to this watch-out</span>
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.pros.length === 0 && data.cons.length === 0 && !data.is_newbie && (
          <p className="text-xs text-slate-500 italic">
            No historical reviews recorded yet for this profile.
          </p>
        )}
      </div>
    </div>
  );
}
