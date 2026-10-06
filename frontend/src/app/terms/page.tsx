"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 animate-fade-up space-y-8">
      <div className="text-center space-y-3">
        <Badge variant="subtle" className="text-xs uppercase font-bold">
          Governance & Legal
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          Platform Terms & Charter Policies
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Standard operational clauses, intellectual property transfers, and dispute resolution guidelines.
        </p>
      </div>

      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Bilateral Project Charters
          </h2>
          <p>
            Participation in any project on VOUCH is governed by the specific project charter signed by the company sponsor, student squad, and designated expert mentor. Acceptance of a charter is cryptographically signed and stored in the immutable platform ledger.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Escrow Lockers & Payment Release
          </h2>
          <p>
            For funded initiatives, company sponsors must deposit 100% of the milestone reward pool prior to contributor execution. Funds are held in escrow and released strictly upon milestone approval or arbitrated dispute resolution.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. Code Integrity & Similarity Standards
          </h2>
          <p>
            All submitted code is analyzed against reference repositories. Submissions with Jaccard similarity indices exceeding 40% are flagged for mentor review. Verified integrity infractions may result in disqualification and star penalties.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Exit Terms & Withdrawal Penalties
          </h2>
          <p>
            If a sponsor withdraws without cause after milestone work has commenced, a 10% compensation fee is charged to the sponsor wallet and pro-rata credit is awarded to contributors. Unilateral abandonment by contributors incurs a -0.5 star penalty.
          </p>
        </Card>
      </div>
    </div>
  );
}
