"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
  Coins,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Info,
  Scale,
  Sparkles,
} from "lucide-react";

export default function PricingPage() {
  const [amount, setAmount] = useState<number>(100000);
  const [expertPresent, setExpertPresent] = useState<boolean>(true);
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateSplit = async (amt: number, expert: boolean) => {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/payout/calculate", {
        method: "POST",
        body: JSON.stringify({
          amount: amt,
          student_weights: [0.5, 0.3, 0.2],
          expert_present: expert,
        }),
      });
      setCalculation(res);
    } catch {
      // Fallback local integer math
      const platformFee = Math.floor(amt * 0.10);
      const aiReserve = Math.floor(amt * 0.05);
      const net = amt - platformFee - aiReserve;
      const expertAmt = expert ? Math.floor(net * 0.30) : 0;
      const studentPool = net - expertAmt;

      const equalPart = Math.floor((studentPool * 0.40) / 3);
      const weightedPool = studentPool - equalPart * 3;

      const s1 = equalPart + Math.floor(weightedPool * 0.5);
      const s2 = equalPart + Math.floor(weightedPool * 0.3);
      const s3 = equalPart + Math.floor(weightedPool * 0.2);
      const remainder = studentPool - (s1 + s2 + s3);

      setCalculation({
        total_amount: amt,
        platform_fee: platformFee,
        ai_compute_reserve: aiReserve,
        expert_payout: expertAmt,
        student_payouts: [s1 + remainder, s2, s3],
        total_disbursed: amt,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateSplit(amount, expertPresent);
  }, [amount, expertPresent]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 animate-fade-up space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="subtle" className="text-xs uppercase font-bold">
          Transparent Economics
        </Badge>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
          Pricing & Payout Math
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Deterministic, integer-rupee reward distribution. No hidden deductions, no arbitrary withholding, and zero rounding leaks.
        </p>
      </div>

      {/* Fee Model Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="border-t-4 border-t-slate-800 dark:border-t-slate-200">
          <CardHeader>
            <Badge variant="subtle" className="w-fit">PLATFORM</Badge>
            <CardTitle className="text-2xl font-black">10%</CardTitle>
            <CardDescription>Platform Infrastructure Fee</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 dark:text-slate-400">
            Covers cryptographic ledger auditing, identity verification, dispute mediation desk, and workspace hosting.
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-teal-600">
          <CardHeader>
            <Badge variant="default" className="w-fit">RESERVE</Badge>
            <CardTitle className="text-2xl font-black">5%</CardTitle>
            <CardDescription>AI Compute & Tooling Reserve</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 dark:text-slate-400">
            Pre-funds shared GPU inference, similarity shingle embeddings, and model compilation tools for project contributors.
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-600">
          <CardHeader>
            <Badge variant="verified" className="w-fit">CONTRIBUTORS</Badge>
            <CardTitle className="text-2xl font-black">85%</CardTitle>
            <CardDescription>Direct Contributor Pool</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 dark:text-slate-400">
            Split 30% to lead expert advisors and 70% to student squads with hybrid equal + weighted contribution splits.
          </CardContent>
        </Card>
      </div>

      {/* Interactive Calculator */}
      <Card className="shadow-lg border-teal-200 dark:border-teal-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Interactive Payout Split Simulator</CardTitle>
              <CardDescription>
                Try the official ₹1,00,000 specification example or enter a custom project budget:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Project Escrow Amount (Rupees)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                <Input
                  type="number"
                  min="1000"
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="pl-8 font-mono font-bold"
                />
              </div>
            </div>

            <div className="sm:pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expertPresent}
                  onChange={(e) => setExpertPresent(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Include Lead Expert (30% net share)</span>
              </label>
            </div>
          </div>

          {/* Results Table */}
          {calculation && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500">
                    <th className="py-2.5">Stakeholder</th>
                    <th className="py-2.5">Calculation Rule</th>
                    <th className="py-2.5 text-right">Exact Rupee Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-2.5 font-semibold">Platform Fee</td>
                    <td className="py-2.5 text-slate-500">10% fixed platform cut</td>
                    <td className="py-2.5 text-right font-mono font-bold">
                      ₹{calculation.platform_fee.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold">AI Compute Reserve</td>
                    <td className="py-2.5 text-slate-500">5% fixed GPU compute fund</td>
                    <td className="py-2.5 text-right font-mono font-bold">
                      ₹{calculation.ai_compute_reserve.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  {expertPresent && (
                    <tr className="bg-teal-50/40 dark:bg-teal-950/20">
                      <td className="py-2.5 font-bold text-teal-900 dark:text-teal-200">
                        Lead Expert Advisor
                      </td>
                      <td className="py-2.5 text-teal-700 dark:text-teal-300">
                        30% of ₹{(amount - calculation.platform_fee - calculation.ai_compute_reserve).toLocaleString("en-IN")} net
                      </td>
                      <td className="py-2.5 text-right font-mono font-black text-teal-700 dark:text-teal-300">
                        ₹{calculation.expert_payout.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )}
                  {calculation.student_payouts.map((stAmt: number, idx: number) => {
                    const weights = [0.5, 0.3, 0.2];
                    return (
                      <tr key={idx}>
                        <td className="py-2.5 font-semibold">
                          Student {idx + 1} ({["Lead Developer", "Model Architect", "QA & Edge Deployment"][idx]})
                        </td>
                        <td className="py-2.5 text-slate-500">
                          Weight {weights[idx]} (40% equal + 60% weighted share)
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{stAmt.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 font-bold text-sm">
                    <td className="pt-3">Total Reconciled Sum</td>
                    <td className="pt-3 text-xs text-slate-500">
                      Sum of parts matches initial escrow exactly
                    </td>
                    <td className="pt-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      ₹{calculation.total_disbursed.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Worked Example Callout */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-xs text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <strong>SPEC Section 8 Verified Benchmark:</strong> For standard ₹1,00,000 project: Expert receives{" "}
              <strong>₹25,500</strong>; Students receive <strong>₹25,783</strong>, <strong>₹18,643</strong>, and{" "}
              <strong>₹15,074</strong>, summing to ₹1,00,000 with zero rounding leak.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
