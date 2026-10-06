"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Coins,
  History,
  ArrowLeft,
  Info,
  Scale,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface CharterData {
  id: string;
  project_id: string;
  version: number;
  engagement_model: string;
  scope: string;
  ip_clause: string;
  confidentiality_clause: string;
  exit_terms: string;
  commercialisation_clause: string;
  split_config: any;
  is_current: boolean;
}

interface ProjectData {
  id: string;
  title: string;
  public_summary: string;
  budget: number;
  engagement_model: string;
  sponsor_id: string;
}

interface MilestoneData {
  id: string;
  sequence: number;
  title: string;
  description: string;
  budget: number;
  status: string;
}

interface BriefData {
  project_id: string;
  title: string;
  confidential_brief: string;
  datasets: string[];
  access_granted_to: string;
}

export default function CharterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [charter, setCharter] = useState<CharterData | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [userAccepted, setUserAccepted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Acceptance checkboxes
  const [checkTerms, setCheckTerms] = useState(false);
  const [checkModel, setCheckModel] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Fetch charter
        const cRes = await apiFetch<{
          charter: CharterData;
          user_accepted_current_version: boolean;
        }>(`/api/charters/${id}`);
        setCharter(cRes.charter);
        setUserAccepted(cRes.user_accepted_current_version);

        // 2. Fetch project details
        const pId = cRes.charter.project_id;
        const pRes = await apiFetch<{
          project: ProjectData;
          milestones: MilestoneData[];
        }>(`/api/projects/${pId}`);
        setProject(pRes.project);
        setMilestones(pRes.milestones || []);

        // 3. If accepted or user is sponsor owner, fetch brief
        if (cRes.user_accepted_current_version || (user && user.role === "sponsor")) {
          try {
            const bRes = await apiFetch<BriefData>(`/api/projects/${pId}/brief`);
            setBrief(bRes);
          } catch {
            // Brief access restricted
          }
        }

        // 4. Fetch charter version history
        try {
          const hRes = await apiFetch<{ versions: any[] }>(
            `/api/projects/${pId}/charters/history`
          );
          setHistory(hRes.versions || []);
        } catch {
          // Optional
        }
      } catch (err: any) {
        toast.error("Could not load charter: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user]);

  const handleAcceptCharter = async () => {
    if (!charter) return;
    setAccepting(true);
    try {
      await apiFetch(`/api/projects/${charter.project_id}/charter/accept`, {
        method: "POST",
        body: JSON.stringify({
          version: charter.version,
          accept_engagement_model: true,
        }),
      });

      setUserAccepted(true);
      setShowConfirmModal(false);
      toast.success(
        `Charter v${charter.version} accepted! Cryptographic signature logged to ledger.`
      );

      // Now fetch confidential brief
      try {
        const bRes = await apiFetch<BriefData>(
          `/api/projects/${charter.project_id}/brief`
        );
        setBrief(bRes);
      } catch (err: any) {
        toast.error("Brief unlock error: " + err.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Acceptance failed");
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineOrLeave = () => {
    if (
      confirm(
        "Are you sure you want to decline / leave this project? Note: Any previously accepted milestone work retains verified ledger credit and pro-rata payout."
      )
    ) {
      toast.info("You declined or stepped down from the charter.");
      router.push(user ? `/${user.role}` : "/");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-8">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-96 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (!charter || !project) {
    return (
      <div className="mx-auto max-w-xl p-12 text-center">
        <h2 className="text-xl font-bold">Charter Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The requested charter could not be located on the immutable ledger.
        </p>
        <Button asChild className="mt-6">
          <Link href="/open-problems">Back to Open Problems</Link>
        </Button>
      </div>
    );
  }

  const isFunded = charter.engagement_model === "funded";
  const isSponsor = user?.role === "sponsor";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-fade-up">
      {/* Top Back navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={user ? `/${user.role}` : "/open-problems"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="subtle" className="text-xs font-mono font-bold">
            Project: {project.id}
          </Badge>
          <Badge variant="default" className="text-xs font-bold">
            Charter Version {charter.version}
          </Badge>
        </div>
      </div>

      {/* Header Banner */}
      <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Collaboration Charter
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">
                SHA-256 Ledger Anchored
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              {project.title}
            </h1>
          </div>

          {/* Prominent Engagement Model Badge */}
          <div className="flex flex-col items-end">
            {isFunded ? (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-right dark:border-emerald-800 dark:bg-emerald-950/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                  Engagement Model
                </span>
                <span className="text-base font-black text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5 justify-end">
                  <Coins className="h-4 w-4" />
                  Funded Project (₹{project.budget.toLocaleString("en-IN")} Escrow)
                </span>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-right dark:border-amber-800 dark:bg-amber-950/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                  Engagement Model
                </span>
                <span className="text-base font-black text-amber-800 dark:text-amber-200 flex items-center gap-1.5 justify-end">
                  <Scale className="h-4 w-4" />
                  Unpaid / Knowledge-Sharing (Credit Only)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Public Project Summary */}
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Public Project Summary
          </h4>
          <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {project.public_summary}
          </p>
        </div>
      </div>

      {/* Main Charter Clauses */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 cols: Terms & Clauses */}
        <div className="space-y-6 lg:col-span-2">
          {/* Scope & Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>1. Scope of Work & Milestones</span>
              </CardTitle>
              <CardDescription>
                Defined deliverables required for milestone disbursement and review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {charter.scope}
              </p>

              {/* Milestone list */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Agreed Project Milestones ({milestones.length})
                </h5>
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Milestone {m.sequence}: {m.title}
                      </span>
                      {isFunded && (
                        <Badge variant="subtle" className="text-xs font-mono font-bold">
                          ₹{m.budget.toLocaleString("en-IN")}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {m.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legal Clauses: IP, Confidentiality, Exit, Commercialisation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>2. Intellectual Property & Confidentiality</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  Intellectual Property (IP) Terms:
                </span>
                <p>{charter.ip_clause}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  Confidentiality & Non-Disclosure:
                </span>
                <p>{charter.confidentiality_clause}</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  Exit Terms & Milestone Rights:
                </span>
                <p>{charter.exit_terms}</p>
                <p className="mt-1.5 text-teal-700 dark:text-teal-400 font-semibold">
                  * Note: Accepted milestone work unconditionally retains full verified credit on the ledger.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  Commercialisation Clause:
                </span>
                <p>{charter.commercialisation_clause}</p>
              </div>
            </CardContent>
          </Card>

          {/* Worked Rupee Split Example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span>3. Reward Split Calculation (SPEC Section 8)</span>
              </CardTitle>
              <CardDescription>
                Deterministic integer rupee split for standard ₹1,00,000 project escrow:
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isFunded ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500">
                        <th className="py-2">Stakeholder / Pool</th>
                        <th className="py-2">Share %</th>
                        <th className="py-2">Exact Amount</th>
                        <th className="py-2">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="py-2 font-semibold text-slate-900 dark:text-white">
                          Platform Infrastructure Fee
                        </td>
                        <td className="py-2">10%</td>
                        <td className="py-2 font-mono font-bold">₹10,000</td>
                        <td className="py-2 text-slate-500">Direct deduction</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-900 dark:text-white">
                          AI Compute Reserve
                        </td>
                        <td className="py-2">5%</td>
                        <td className="py-2 font-mono font-bold">₹5,000</td>
                        <td className="py-2 text-slate-500">Direct deduction</td>
                      </tr>
                      <tr className="bg-teal-50/50 dark:bg-teal-950/20">
                        <td className="py-2 font-semibold text-teal-900 dark:text-teal-200">
                          Expert Advisor Share
                        </td>
                        <td className="py-2 font-semibold text-teal-900 dark:text-teal-200">
                          30% of pool
                        </td>
                        <td className="py-2 font-mono font-black text-teal-700 dark:text-teal-300">
                          ₹25,500
                        </td>
                        <td className="py-2 text-teal-800 dark:text-teal-300">
                          30% of ₹85,000 net
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold">Student 1 (Weight 0.5)</td>
                        <td className="py-2">40% equal + 60% wgt</td>
                        <td className="py-2 font-mono font-bold">₹25,783</td>
                        <td className="py-2 text-slate-500">Remainder pennies added</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold">Student 2 (Weight 0.3)</td>
                        <td className="py-2">40% equal + 60% wgt</td>
                        <td className="py-2 font-mono font-bold">₹18,643</td>
                        <td className="py-2 text-slate-500">Integer rupee math</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold">Student 3 (Weight 0.2)</td>
                        <td className="py-2">40% equal + 60% wgt</td>
                        <td className="py-2 font-mono font-bold">₹15,074</td>
                        <td className="py-2 text-slate-500">Integer rupee math</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                        <td className="pt-2">Total Verified Sum</td>
                        <td className="pt-2">100%</td>
                        <td className="pt-2 font-mono text-emerald-600 dark:text-emerald-400">
                          ₹1,00,000
                        </td>
                        <td className="pt-2 text-slate-500">Zero rounding leak</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-bold">Unpaid / Open Knowledge-Sharing Initiative</p>
                  <p className="mt-1">
                    This project operates without a monetary reward pool. All accepted milestones are rewarded with immutable SHA-256 ledger proof of completion, institutional co-authorship credit, and public star endorsements.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confidential Brief Section (Only after acceptance) */}
          <Card className={userAccepted || isSponsor ? "border-emerald-300 dark:border-emerald-800" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {userAccepted || isSponsor ? (
                    <Unlock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>4. Confidential Brief & Datasets</span>
                </CardTitle>
                <Badge
                  variant={userAccepted || isSponsor ? "verified" : "flagged"}
                  className="text-[10px]"
                >
                  {userAccepted || isSponsor ? "ACCESS GRANTED" : "LOCKED — ACCEPT CHARTER"}
                </Badge>
              </div>
              <CardDescription>
                Server-side gated: Confidential instructions and raw datasets remain inaccessible until the current charter version is signed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userAccepted || isSponsor ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <span className="font-bold block mb-1">
                      CONFIDENTIAL PROJECT SPECIFICATION:
                    </span>
                    <p className="leading-relaxed">
                      {brief?.confidential_brief || "Access authorized by server session."}
                    </p>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Authorized Datasets & Secure Repositories
                    </h5>
                    <div className="space-y-1.5">
                      {(brief?.datasets || ["dataset_macular_v2.tar.gz"]).map((ds, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                          <span className="font-mono font-semibold">{ds}</span>
                          <Badge variant="subtle" className="text-[10px]">
                            Internal Sandbox Only
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                  <Lock className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    Confidential Brief Gated
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    Please accept Charter Version {charter.version} using the acceptance panel on the right to review the confidential brief and download datasets.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right col: Acceptance Panel & Sponsor Tools */}
        <div className="space-y-6">
          {/* Acceptance Card */}
          <Card className="border-teal-300 dark:border-teal-800 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span>Charter Acceptance Panel</span>
              </CardTitle>
              <CardDescription>
                {userAccepted
                  ? `You have accepted Charter v${charter.version}.`
                  : `Review terms and accept to participate.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userAccepted ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Charter Accepted & Active</span>
                  </div>
                  <p>
                    Your signature for Charter Version {charter.version} is cryptographically anchored on the SHA-256 ledger. Workspace access and confidential briefs are fully unlocked.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
                    Both affirmations are mandatory prior to cryptographic signature:
                  </div>

                  {/* Checkbox 1 */}
                  <label className="flex items-start gap-3 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checkTerms}
                      onChange={(e) => setCheckTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      I accept charter version <strong>{charter.version}</strong>, including all IP assignment, exit policies, and confidentiality clauses.
                    </span>
                  </label>

                  {/* Checkbox 2 */}
                  <label className="flex items-start gap-3 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checkModel}
                      onChange={(e) => setCheckModel(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      I understand and agree to the <strong>{charter.engagement_model}</strong> engagement model (
                      {isFunded ? "Escrow funded milestones" : "Unpaid credit and ledger proof only"}
                      ).
                    </span>
                  </label>

                  <Button
                    type="button"
                    disabled={!checkTerms || !checkModel || accepting}
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full font-bold"
                  >
                    Accept Charter v{charter.version}
                  </Button>
                </div>
              )}

              {/* Decline or leave button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeclineOrLeave}
                  className="w-full text-xs text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                >
                  Decline / Leave Project
                </Button>
                <p className="mt-1 text-[11px] text-center text-slate-400">
                  Accepted work maintains verified credit.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Version History List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" />
                <span>Charter Version History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                {history.length === 0 ? (
                  <p className="text-slate-400">Version 1 (Initial Release)</p>
                ) : (
                  history.map((v) => (
                    <div
                      key={v.id || v.version}
                      className={`flex items-center justify-between p-2 rounded-xl ${
                        v.version === charter.version
                          ? "bg-teal-50 font-bold text-teal-900 dark:bg-teal-950/60 dark:text-teal-200"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span>Version {v.version}</span>
                      <Badge variant={v.is_current ? "verified" : "subtle"}>
                        {v.is_current ? "Current" : "Archived"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>

              {/* Sponsor publish controls */}
              {isSponsor && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Sponsor Controls
                  </span>
                  <p className="text-xs text-slate-500 mb-2">
                    Publishing a new version requires all contributors to re-accept before submitting code.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => toast.info("Charter revision editor will be enabled in Phase 5 scoping workflow.")}
                  >
                    Draft Charter v{charter.version + 1}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-fade-up">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-center text-lg font-bold text-slate-900 dark:text-white">
              Confirm Charter Acceptance
            </h3>
            <p className="mt-2 text-center text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              By confirming, your cryptographic acceptance of <strong>Charter v{charter.version}</strong> under the <strong>{charter.engagement_model}</strong> model will be permanently recorded on the immutable SHA-256 ledger.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 font-semibold"
                onClick={() => setShowConfirmModal(false)}
                disabled={accepting}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1 font-bold"
                onClick={handleAcceptCharter}
                disabled={accepting}
              >
                {accepting ? "Signing to Ledger..." : "Confirm & Sign"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
