"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { KeyRound, ArrowRight, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("student.a@vouch.local");
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch<{
        status: string;
        message: string;
        demo_reset_token: string;
      }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setDemoToken(res.demo_reset_token);
      toast.success("Demo password reset token generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate reset token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 animate-fade-up">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset token (displayed on-screen in demo mode).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demoToken ? (
            <div className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/80 p-5 text-center text-xs dark:border-teal-900 dark:bg-teal-950/40">
              <ShieldCheck className="mx-auto h-7 w-7 text-teal-600 dark:text-teal-400" />
              <h4 className="font-bold text-sm text-teal-900 dark:text-teal-100">
                Demo Reset Token Generated
              </h4>
              <p className="text-slate-600 dark:text-slate-300">
                In this local synthetic sandbox, use the token below to set your new password:
              </p>
              <div className="rounded-xl border border-teal-300 bg-white p-3 font-mono text-sm font-bold text-teal-800 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-300 select-all">
                {demoToken}
              </div>
              <Button asChild className="w-full font-bold">
                <Link
                  href={`/reset-password?token=${demoToken}`}
                  className="flex items-center justify-center gap-2"
                >
                  <span>Continue to Password Reset</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Email Address
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vouch.local"
                />
              </div>

              <Button
                type="submit"
                variant="default"
                disabled={loading}
                className="w-full font-bold"
              >
                {loading ? "Generating Token..." : "Generate Reset Token"}
              </Button>

              <div className="text-center text-xs text-slate-500 pt-2">
                Remember your password?{" "}
                <Link href="/login" className="text-teal-600 hover:underline dark:text-teal-400 font-bold">
                  Back to Log In
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
