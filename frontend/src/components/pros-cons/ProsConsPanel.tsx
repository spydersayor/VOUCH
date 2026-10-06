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
import Link from "next/link";

export interface EvidenceItem {
  project?: string;
  project_id?: string | null;
  charter_id?: string | null;
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
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl shadow-black/40">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9d9da8]">
            {title}
          </span>
          {data.is_newbie && (
            <Badge variant="subtle" className="gap-1 border-[#8f7cff]/30 bg-[#8f7cff]/10 text-[#b9a9ff]">
              <Sparkles className="h-3 w-3 text-[#b9a9ff]" />
              Newbie Profile
            </Badge>
          )}
          {data.limited_data && !data.is_newbie && (
            <Badge variant="subtle" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-300">
              <ShieldAlert className="h-3 w-3" />
              Limited Data (&lt; 2 closed projects)
            </Badge>
          )}
        </div>
      </div>

      {data.is_newbie && data.newbie_message && (
        <div className="mb-3.5 rounded-xl border border-[#8f7cff]/20 bg-[#8f7cff]/[0.06] p-3 text-xs text-white/90">
          <p className="font-medium text-white">{data.newbie_message}</p>
          <p className="mt-0.5 text-[11px] text-[#9d9da8]">
            Verified academic credentials and skill milestones shown below with zero adverse flags.
          </p>
        </div>
      )}

      <div className="space-y-3.5">
        {/* Strengths (Pros) */}
        {data.pros.length > 0 && (
          <div className="space-y-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
              Strengths ({data.pros.length})
            </span>
            <div className="space-y-2">
              {data.pros.map((p) => {
                const isExpanded = !!expandedKeys[p.key];
                return (
                  <div
                    key={p.key}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-950/[0.15] p-3 text-xs transition-all hover:border-emerald-500/35"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                        <span className="font-normal leading-relaxed text-white/90">
                          {p.text}
                        </span>
                      </div>
                      {p.evidence && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(p.key)}
                          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300 hover:text-emerald-200 transition-colors"
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
                      <div className="mt-2.5 rounded-lg border border-white/[0.08] bg-[#050508]/80 p-3 text-[11px] backdrop-blur-md">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#9d9da8]">
                          <div>
                            <span className="font-mono text-[10px] uppercase text-[#6f6f7b]">
                              Verified Source:
                            </span>{" "}
                            <span className="text-white font-medium">{p.evidence.project || "Platform Closed Project"}</span>
                          </div>
                          <div>
                            <span className="font-mono text-[10px] uppercase text-[#6f6f7b]">
                              Reviews:
                            </span>{" "}
                            <span className="text-white font-medium">{p.evidence.review_count || 1} evaluations</span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-[10px]">
                          <div className="flex items-center gap-1.5 font-mono text-[#9d9da8]">
                            <FileCheck className="h-3 w-3 text-emerald-400" />
                            <span>Ledger Ref: {p.evidence.ledger_ref}</span>
                          </div>
                          {(p.evidence.charter_id || p.evidence.project_id) && (
                            <Link
                              href={`/charters/${p.evidence.charter_id || p.evidence.project_id}`}
                              className="font-mono text-[#b9a9ff] hover:text-white transition-colors"
                            >
                              View Charter →
                            </Link>
                          )}
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
          <div className="space-y-2 pt-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">
              Watch-outs ({data.cons.length})
            </span>
            <div className="space-y-2">
              {data.cons.map((c) => {
                const isExpanded = !!expandedKeys[c.key];
                const isReplying = replyOpenKey === c.key;
                return (
                  <div
                    key={c.key}
                    className="rounded-xl border border-amber-500/20 bg-amber-950/[0.15] p-3 text-xs transition-all hover:border-amber-500/35"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                        <span className="font-normal leading-relaxed text-white/90">
                          {c.text}
                        </span>
                      </div>
                      {c.evidence && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(c.key)}
                          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-amber-300 hover:text-amber-200 transition-colors"
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
                      <div className="mt-2.5 rounded-lg border border-white/[0.08] bg-[#050508]/80 p-3 text-[11px] backdrop-blur-md">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#9d9da8]">
                          <div>
                            <span className="font-mono text-[10px] uppercase text-[#6f6f7b]">
                              Historical Project:
                            </span>{" "}
                            <span className="text-white font-medium">{c.evidence.project || "Past Engagement"}</span>
                          </div>
                          <div>
                            <span className="font-mono text-[10px] uppercase text-[#6f6f7b]">
                              Criterion Score:
                            </span>{" "}
                            <span className="text-white font-medium">{c.evidence.metric_score ?? "N/A"}/5.0</span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-[10px]">
                          <div className="flex items-center gap-1.5 font-mono text-[#9d9da8]">
                            <FileCheck className="h-3 w-3 text-amber-400" />
                            <span>Ledger Audit: {c.evidence.ledger_ref}</span>
                          </div>
                          {(c.evidence.charter_id || c.evidence.project_id) && (
                            <Link
                              href={`/charters/${c.evidence.charter_id || c.evidence.project_id}`}
                              className="font-mono text-[#b9a9ff] hover:text-white transition-colors"
                            >
                              View Charter →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Candidate Public Reply */}
                    {c.reply ? (
                      <div className="mt-2.5 rounded-xl border border-white/[0.08] bg-[#050508]/80 p-3 text-[11px]">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#b9a9ff]">
                          <MessageSquare className="h-3 w-3" />
                          <span>Candidate Public Reply:</span>
                        </div>
                        <p className="mt-1 leading-relaxed text-white/90 italic">
                          &quot;{c.reply.text}&quot;
                        </p>
                      </div>
                    ) : (
                      canReply && (
                        <div className="mt-2 pt-1">
                          {isReplying ? (
                            <div className="space-y-2 rounded-xl border border-white/[0.08] bg-[#050508]/90 p-3">
                              <label className="font-mono text-[10px] uppercase tracking-wider text-[#9d9da8]">
                                Post a public explanation anchored to ledger:
                              </label>
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Explain context or how this was resolved..."
                                rows={2}
                                className="w-full rounded-lg border border-white/[0.12] bg-[#0c0d12] p-2 text-xs text-white placeholder-[#6f6f7b] focus:border-[#8f7cff] focus:outline-none focus:ring-1 focus:ring-[#8f7cff]"
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
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-[#b9a9ff] hover:text-white transition-colors"
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
          <p className="font-mono text-xs text-[#6f6f7b] italic">
            No historical reviews recorded yet for this profile.
          </p>
        )}
      </div>
    </div>
  );
}
