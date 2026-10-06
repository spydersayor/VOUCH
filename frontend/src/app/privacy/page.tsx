"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 animate-fade-up space-y-8">
      <div className="text-center space-y-3">
        <Badge variant="subtle" className="text-xs uppercase font-bold">
          Data Protection
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          Confidentiality Pledge & Privacy
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          How VOUCH isolates clinical datasets, guards proprietary briefs, and manages synthetic telemetry.
        </p>
      </div>

      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
            <Lock className="h-5 w-5 text-teal-600" />
            <span>Confidential Brief & Dataset Isolation</span>
          </div>
          <p>
            Detailed technical briefs and medical dataset downloads are never exposed to public crawlers or unverified accounts. They are gated strictly behind server-side authorization checks that require an active charter signature.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Synthetic Local Demo Sandbox
          </h2>
          <p>
            All user profiles, bank balances, and clinical data within this demonstration environment are purely synthetic. No real patient data is ingested, and no external trackers or third-party advertising scripts are loaded.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Simulated KYC & Right to Erasure
          </h2>
          <p>
            Users can submit an account deletion request via their settings page. To maintain immutable chain integrity, personal identifying info is scrubbed while ledger hash references are preserved for audit consistency.
          </p>
        </Card>
      </div>
    </div>
  );
}
