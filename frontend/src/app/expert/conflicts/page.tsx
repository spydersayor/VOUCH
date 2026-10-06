"use client";

import React, { useState, useEffect } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldCheck, FileCheck, CheckCircle2 } from "lucide-react";

export default function ExpertConflictsPage() {
  const { user } = useAuth();
  const isExpertB = user?.email === "expert.b@vouch.local";

  return (
    <RoleGuard allowedRoles={["expert", "admin"]}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="expert" />
        <main className="flex-1 p-8 animate-fade-up">
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  Conflict-of-Interest Disclosures &amp; Ledger Audit
                </h1>
                <Badge variant="subtle" className="gap-1 border-amber-500/40 text-amber-700">
                  <ShieldCheck className="h-3 w-3" />
                  GOVERNANCE
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                To guarantee impartial technical guidance, all industry affiliations, consulting engagements, and IP overlaps are declared and anchored to the ledger.
              </p>
            </div>

            <div className="space-y-4">
              {isExpertB ? (
                <Card className="border-amber-500/30 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Active Declared Affiliation: RetinaVision Labs
                        </h3>
                        <Badge variant="subtle" className="text-xs">RECORDED</Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>Target Sponsor:</strong> Apex Health AI (usr_sponsor)
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>Reason:</strong> Advisor to rival ophthalmology imaging firm; active consultancy contract with direct IP overlap in fundus edge inference.
                      </p>
                      <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-50/50 p-2.5 text-[11px] font-mono text-slate-600 dark:bg-amber-950/20 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>Ledger Exclusion Proof:</span>
                        </div>
                        <p className="mt-0.5">
                          Action: CANDIDATE_CONFLICT_EXCLUDED • Block: Verified immutable chain
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Zero Active Conflicts of Interest Declared
                      </h3>
                      <p className="text-xs text-slate-500">
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
