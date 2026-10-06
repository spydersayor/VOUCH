"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Lock, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialToken = searchParams?.get("token") || "";

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      setSuccess(true);
      toast.success("Password reset successfully! You can now log in.");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-[#b9a9ff]">
          <Lock className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Set New Password</CardTitle>
        <CardDescription>
          Enter your reset token and your new account password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4 text-center text-xs">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="font-semibold text-white">
              Password updated successfully!
            </p>
            <Button asChild className="w-full font-semibold h-11">
              <Link href="/login">Continue to Log In →</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                Reset Token
              </label>
              <Input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="rst_xxxxxx"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                New Password
              </label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="w-full font-semibold h-11"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24 animate-fade-up">
      <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-[#9d9da8]">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
