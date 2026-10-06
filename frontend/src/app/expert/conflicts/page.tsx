"use client";

import React from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, FileCheck, CheckCircle2 } from "lucide-react";

export default function ExpertConflictsPage() {
  const { user } = useAuth();
  const isExpertB = user?.email === "expert.b@vouch.local";

  return (
    <RoleGuard allowedRoles={["expert", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="expert" />
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="border-b border-white/[0.06] pb-6">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Conflict-of-Interest Disclosures &amp; Ledger Audit
                </h1>
                <Badge variant="subtle" className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-[10px]">
                  <ShieldCheck className="h-3 w-3" />
                  GOVERNANCE
                </Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                To guarantee impartial technical guidance, all industry affiliations, consulting engagements, and IP overlaps are declared and anchored to the ledger.
              </p>
            </div>

            <div className="space-y-4">
              {isExpertB ? (
                <Card className="border-amber-500/30 bg-amber-950/[0.12] p-6">
                  <div className="flex items-start gap-3.5">
                    <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          Active Declared Affiliation: RetinaVision Labs
                        </h3>
                        <Badge variant="subtle" className="font-mono text-[10px] text-amber-300 border-amber-500/30 bg-amber-500/10">RECORDED</Badge>
                      </div>
                      <p className="text-xs text-[#9d9da8]">
                        <strong className="text-white">Target Sponsor:</strong> Apex Health AI (usr_sponsor)
                      </p>
                      <p className="text-xs text-[#9d9da8] leading-relaxed">
                        <strong className="text-white">Reason:</strong> Advisor to rival ophthalmology imaging firm; active consultancy contract with direct IP overlap in fundus edge inference.
                      </p>
                      <div className="mt-3.5 rounded-xl border border-white/[0.08] bg-[#050508]/80 p-3 text-[11px] font-mono text-[#9d9da8]">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>Ledger Exclusion Proof:</span>
                        </div>
                        <p className="mt-1 text-[#6f6f7b]">
                          Action: CANDIDATE_CONFLICT_EXCLUDED • Block: Verified immutable chain
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <div className="flex items-center gap-3.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Zero Active Conflicts of Interest Declared
                      </h3>
                      <p className="text-xs text-[#9d9da8] mt-0.5">
                        You are fully eligible to guide and review projects across all registered industry sponsors.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
