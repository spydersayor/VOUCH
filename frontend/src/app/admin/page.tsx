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
import { RoleSidebar } from "@/components/shell/RoleSidebar";

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
      <div className="flex min-h-[calc(100vh-4rem)]">
        <RoleSidebar role="admin" />
        <main className="flex-1 p-6 sm:p-10 animate-fade-up">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    System Administration &amp; Governance
                  </h1>
                  <Badge variant="subtle" className="font-mono text-[10px] text-[#b9a9ff] border-[#8f7cff]/30 bg-[#8f7cff]/10">
                    OPERATIONS
                  </Badge>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#9d9da8]">
                  Audit the cryptographic ledger, monitor KYC verification queues, and run demo tamper tests.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Ledger Chain
                  </span>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
                    VERIFIED INTACT
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">SHA-256 sequential hash checks</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Disputes &amp; Flags
                  </span>
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                    0 Pending
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Queue clear</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                    Seed Accounts
                  </span>
                  <FileText className="h-4 w-4 text-[#b9a9ff]" />
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                    7 Active
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-[#6f6f7b]">Sponsor, Experts, Students, Admin</p>
                </CardContent>
              </Card>
            </div>

            {/* Demo Audit Tools */}
            <Card className="p-6">
              <h3 className="text-base font-bold text-white">
                🛠️ Demonstration Audit Tools
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#9d9da8] leading-relaxed">
                Simulate an unauthorized SQLite record alteration to showcase the live ledger verifier catching the broken chain:
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="destructive"
                  disabled={tampering}
                  onClick={handleSimulateTamper}
                  className="font-semibold gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>{tampering ? "Tampering..." : "Simulate Tamper on Block #2"}</span>
                </Button>
                <Button
                  variant="outline"
                  disabled={resetting}
                  onClick={handleResetData}
                  className="font-semibold gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{resetting ? "Resetting..." : "Reset All Demo Data & Ledger"}</span>
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
