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
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24 animate-fade-up">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-[#b9a9ff]">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset token (displayed on-screen in demo mode).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demoToken ? (
            <div className="space-y-4 rounded-2xl border border-[#8f7cff]/30 bg-[#8f7cff]/[0.08] p-5 text-center text-xs backdrop-blur-md">
              <ShieldCheck className="mx-auto h-7 w-7 text-[#b9a9ff]" />
              <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                Demo Reset Token Generated
              </h4>
              <p className="text-[#9d9da8]">
                In this local synthetic sandbox, use the token below to set your new password:
              </p>
              <div className="rounded-xl border border-white/[0.12] bg-[#0c0d12] p-3 font-mono text-sm font-bold text-[#b9a9ff] select-all">
                {demoToken}
              </div>
              <Button asChild className="w-full font-semibold">
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
                <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
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
                className="w-full font-semibold h-11"
              >
                {loading ? "Generating Token..." : "Generate Reset Token"}
              </Button>

              <div className="text-center font-mono text-xs text-[#9d9da8] pt-2">
                Remember your password?{" "}
                <Link href="/login" className="text-[#b9a9ff] hover:text-white hover:underline transition-colors">
                  Back to Log In →
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
