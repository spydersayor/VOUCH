"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white py-16 px-4">
      <div className="mx-auto max-w-4xl animate-fade-up space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-mono text-[#b9a9ff]">
            <Scale className="h-3.5 w-3.5" />
            GOVERNANCE &amp; LEGAL
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Platform Terms &amp; Charter Policies
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Standard operational clauses, intellectual property transfers, and dispute resolution guidelines.
          </p>
        </div>

        <div className="space-y-6 text-xs text-zinc-300 leading-relaxed">
          <Card className="p-6 sm:p-8 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
            <h2 className="text-base font-bold text-white">
              1. Bilateral Project Charters
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Participation in any project on VOUCH is governed by the specific project charter signed by the company sponsor, student squad, and designated expert mentor. Acceptance of a charter is cryptographically signed and stored in the immutable platform ledger.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
            <h2 className="text-base font-bold text-white">
              2. Escrow Lockers &amp; Payment Release
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              For funded initiatives, company sponsors must deposit 100% of the milestone reward pool prior to contributor execution. Funds are held in escrow and released strictly upon milestone approval or arbitrated dispute resolution.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
            <h2 className="text-base font-bold text-white">
              3. Code Integrity &amp; Similarity Standards
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              All submitted code is analyzed against reference repositories. Submissions with Jaccard similarity indices exceeding 40% are flagged for mentor review. Verified integrity infractions may result in disqualification and star penalties.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-3 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
            <h2 className="text-base font-bold text-white">
              4. Exit Terms &amp; Withdrawal Penalties
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              If a sponsor withdraws without cause after milestone work has commenced, a 10% compensation fee is charged to the sponsor wallet and pro-rata credit is awarded to contributors. Unilateral abandonment by contributors incurs a -0.5 star penalty.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
