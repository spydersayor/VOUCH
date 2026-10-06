"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white py-16 px-4">
      <div className="mx-auto max-w-4xl animate-fade-up space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-mono text-[#b9a9ff]">
            <ShieldCheck className="h-3.5 w-3.5" />
            DATA PROTECTION
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Confidentiality Pledge &amp; Privacy
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            How VOUCH isolates clinical datasets, guards proprietary briefs, and manages synthetic telemetry.
          </p>
        </div>

        <div className="space-y-6 text-xs text-zinc-300 leading-relaxed">
          <Card className="p-6 sm:p-8 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
            <div className="flex items-center gap-2.5 font-bold text-white text-base">
              <div className="p-1.5 rounded-md bg-violet-500/10 text-[#b9a9ff]">
                <Lock className="h-4 w-4" />
              </div>
              <span>Confidential Brief &amp; Dataset Isolation</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Detailed technical briefs and medical dataset downloads are never exposed to public crawlers or unverified accounts. They are gated strictly behind server-side authorization checks that require an active charter signature.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
            <h2 className="text-base font-bold text-white">
              Synthetic Local Demo Sandbox
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              All user profiles, bank balances, and clinical data within this demonstration environment are purely synthetic. No real patient data is ingested, and no external trackers or third-party advertising scripts are loaded.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
            <h2 className="text-base font-bold text-white">
              Simulated KYC &amp; Right to Erasure
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Users can submit an account deletion request via their settings page. To maintain immutable chain integrity, personal identifying info is scrubbed while ledger hash references are preserved for audit consistency.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
