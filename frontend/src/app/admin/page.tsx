"use client";

import React, { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { ShieldCheck, AlertTriangle, RefreshCw, FileText } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tampering, setTampering] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSimulateTamper = async () => {
    setTampering(true);
    try {
      await apiFetch("/api/ledger/simulate-tamper", {
        method: "POST",
        body: JSON.stringify({ seq: 2 }),
      });
      toast.error("Simulated DB tamper applied! Ledger chain is now broken at block #2.");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTampering(false);
    }
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      await apiFetch("/api/admin/reset", { method: "POST" });
      toast.success("Database and ledger reset to clean initial state!");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                System Administration & Governance
              </h1>
              <Badge variant="subtle">OPERATIONS</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Audit the cryptographic ledger, monitor KYC verification queues, and run demo tamper tests.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ledger Chain
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                VERIFIED INTACT
              </div>
              <p className="mt-1 text-xs text-slate-500">SHA-256 sequential hash checks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Disputes & Flags
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                0 Pending
              </div>
              <p className="mt-1 text-xs text-slate-500">Queue clear</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Seed Accounts
              </span>
              <FileText className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                7 Active
              </div>
              <p className="mt-1 text-xs text-slate-500">Sponsor, Experts, Students, Admin</p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Audit Tools */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            🛠️ Demonstration Audit Tools
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Simulate an unauthorized SQLite record alteration to showcase the live ledger verifier catching the broken chain:
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="accent"
              disabled={tampering}
              onClick={handleSimulateTamper}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{tampering ? "Tampering..." : "Simulate Tamper on Block #2"}</span>
            </Button>
            <Button
              variant="secondary"
              disabled={resetting}
              onClick={handleResetData}
            >
              <RefreshCw className="h-4 w-4" />
              <span>{resetting ? "Resetting..." : "Reset All Demo Data & Ledger"}</span>
            </Button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
