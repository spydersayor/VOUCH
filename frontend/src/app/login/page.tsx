"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Zap, ShieldCheck } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "sponsor", email: "sponsor@vouch.local", label: "Sponsor (Apex)", badge: "Company" },
  { role: "expert", email: "expert.a@vouch.local", label: "Expert A (4.9 ⭐)", badge: "Biomedical" },
  { role: "expert", email: "expert.b@vouch.local", label: "Expert B (Conflict)", badge: "Conflict" },
  { role: "student", email: "student.a@vouch.local", label: "Student A (4.6 ⭐)", badge: "Edge ML" },
  { role: "student", email: "student.b@vouch.local", label: "Student B (3.9 ⭐)", badge: "Fast ML" },
  { role: "student", email: "student.c@vouch.local", label: "Student C (Newbie)", badge: "Newbie" },
  { role: "admin", email: "admin@vouch.local", label: "System Admin", badge: "Auditor" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("student.a@vouch.local");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to role dashboard
  React.useEffect(() => {
    if (user) {
      router.push(`/${user.role}`);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      // Error handled in auth context with toast
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (accEmail: string) => {
    setEmail(accEmail);
    setPassword("Password123!");
    setLoading(true);
    try {
      await login(accEmail, "Password123!");
    } catch {
      // Handled in auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      {/* Quick Login Chips Box */}
      <div className="mb-8 rounded-2xl border border-teal-200 bg-teal-50/70 p-5 dark:border-teal-900 dark:bg-teal-950/40">
        <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200">
          <Zap className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span className="text-sm">One-Click Quick Demo Login</span>
        </div>
        <p className="mt-1 text-xs text-teal-700 dark:text-teal-300">
          Click any seed persona below to authenticate instantly and explore its role dashboard:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin(acc.email)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-teal-400 hover:bg-teal-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-700"
            >
              <span>{acc.label}</span>
              <Badge variant="subtle" className="text-[9px] px-1 py-0">
                {acc.badge}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Standard Login Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Sign in to VOUCH</CardTitle>
          <CardDescription>
            Enter your credentials or choose a quick login persona above.
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password123!"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="w-full text-base font-bold"
            >
              {loading ? "Authenticating..." : "Sign In & Enter Sandbox"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/signup"
              className="font-bold text-teal-600 hover:underline dark:text-teal-400"
            >
              Sign up here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
