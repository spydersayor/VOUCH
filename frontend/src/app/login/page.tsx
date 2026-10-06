"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Building2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Zap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type RoleType = "sponsor" | "student" | "expert" | "admin";

interface RoleOption {
  id: RoleType;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  defaultEmail: string;
}

const ROLES: RoleOption[] = [
  {
    id: "sponsor",
    title: "Company / Sponsor",
    badge: "Enterprise",
    icon: Building2,
    description: "Post briefs, lock funds in escrow, review milestones & IP transfer.",
    defaultEmail: "sponsor@vouch.local",
  },
  {
    id: "student",
    title: "Student",
    badge: "Talent",
    icon: GraduationCap,
    description: "Solve real briefs, earn milestone payouts, build verifiable track records.",
    defaultEmail: "student.a@vouch.local",
  },
  {
    id: "expert",
    title: "Expert",
    badge: "Mentor",
    icon: Sparkles,
    description: "Guide student squads, verify technical quality, earn reward shares.",
    defaultEmail: "expert.a@vouch.local",
  },
  {
    id: "admin",
    title: "Admin",
    badge: "Auditor",
    icon: ShieldCheck,
    description: "Audit SHA-256 ledger chains, resolve disputes, platform governance.",
    defaultEmail: "admin@vouch.local",
  },
];

const DEMO_ACCOUNTS_BY_ROLE: Record<
  RoleType,
  Array<{ email: string; label: string; badge: string }>
> = {
  sponsor: [
    { email: "sponsor@vouch.local", label: "Sponsor (Apex Tech)", badge: "Apex Industries" },
  ],
  student: [
    { email: "student.a@vouch.local", label: "Student A (4.6 ⭐)", badge: "Edge ML" },
    { email: "student.b@vouch.local", label: "Student B (3.9 ⭐)", badge: "Fast ML" },
    { email: "student.c@vouch.local", label: "Student C (Accept Flow Demo)", badge: "Pending Accept" },
  ],
  expert: [
    { email: "expert.a@vouch.local", label: "Expert A (4.9 ⭐)", badge: "Biomedical" },
    { email: "expert.b@vouch.local", label: "Expert B (Conflict Flag)", badge: "Conflict" },
  ],
  admin: [
    { email: "admin@vouch.local", label: "System Admin", badge: "Auditor" },
  ],
};

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [roleMismatchError, setRoleMismatchError] = useState<string | null>(null);

  // If already logged in, redirect to role dashboard
  useEffect(() => {
    if (user) {
      router.push(`/${user.role}`);
    }
  }, [user, router]);

  const handleSelectRole = (role: RoleType) => {
    setSelectedRole(role);
    setRoleMismatchError(null);
    const roleConfig = ROLES.find((r) => r.id === role);
    if (roleConfig) {
      setEmail(roleConfig.defaultEmail);
    }
  };

  const handleQuickLoginChip = async (accEmail: string) => {
    setEmail(accEmail);
    setPassword("Password123!");
    setRoleMismatchError(null);
    setLoading(true);
    try {
      const loggedUser = await login(accEmail, "Password123!", selectedRole || undefined);
      if (loggedUser) {
        router.push(`/${loggedUser.role}`);
      }
    } catch (err: any) {
      setRoleMismatchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setRoleMismatchError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email, password, selectedRole);
      if (loggedUser) {
        router.push(`/${loggedUser.role}`);
      }
    } catch (err: any) {
      setRoleMismatchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentRoleConfig = ROLES.find((r) => r.id === selectedRole);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {!selectedRole ? (
        /* ================= STEP 1: SELECT ROLE ================= */
        <div className="space-y-8 animate-fade-up">
          <div className="text-center space-y-2">
            <Badge variant="subtle" className="text-xs uppercase tracking-wider">
              Step 1 of 2
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              I am a...
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Select your role on VOUCH to access role-specific workflows, verified ledger actions, and dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role.id)}
                  className="group relative flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-teal-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-400"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition group-hover:bg-teal-600 group-hover:text-white dark:bg-teal-950 dark:text-teal-400">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {role.badge}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                      {role.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-xs font-bold text-teal-600 dark:text-teal-400">
                    <span>Continue as {role.title.split(" ")[0]}</span>
                    <span className="ml-1 transition group-hover:translate-x-1">&rarr;</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center text-xs text-slate-500 pt-4">
            Need a new account?{" "}
            <Link
              href="/signup"
              className="font-bold text-teal-600 hover:underline dark:text-teal-400"
            >
              Sign up here
            </Link>
          </div>
        </div>
      ) : (
        /* ================= STEP 2: ENTER CREDENTIALS ================= */
        <div className="space-y-6 animate-fade-up">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setSelectedRole(null);
                setRoleMismatchError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Change role</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Role selected:</span>
              <Badge variant="default" className="text-xs uppercase font-bold">
                {currentRoleConfig?.title}
              </Badge>
            </div>
          </div>

          {/* Quick Demo Chips for selected role only */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-5 dark:border-teal-900 dark:bg-teal-950/40">
            <div className="flex items-center gap-2 font-bold text-teal-950 dark:text-teal-200">
              <Zap className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span className="text-sm">
                One-Click Quick Login ({currentRoleConfig?.title})
              </span>
            </div>
            <p className="mt-1 text-xs text-teal-700 dark:text-teal-300">
              Pre-configured demo accounts for the <strong>{currentRoleConfig?.title}</strong> role:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS_BY_ROLE[selectedRole].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLoginChip(acc.email)}
                  className="inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-teal-500 hover:bg-teal-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-700"
                >
                  <span>{acc.label}</span>
                  <Badge variant="subtle" className="text-[10px] px-1 py-0">
                    {acc.badge}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Role Mismatch Error Alert */}
          {roleMismatchError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Role Verification Failed</p>
                <p className="mt-0.5">{roleMismatchError}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle>Sign In as {currentRoleConfig?.title}</CardTitle>
              <CardDescription>
                Enter your registered credentials to access your dashboard.
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
                  {loading ? "Verifying Role & Authenticating..." : `Sign In as ${currentRoleConfig?.title.split(" ")[0]}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
