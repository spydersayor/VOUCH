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
  ArrowRight,
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
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      {!selectedRole ? (
        /* ================= STEP 1: SELECT ROLE ================= */
        <div className="space-y-8 animate-fade-up">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8f7cff]/30 bg-[#8f7cff]/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-[#b9a9ff]">
              <span>Step 1 of 2</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              I am a...
            </h1>
            <p className="text-sm text-[#9d9da8] max-w-md mx-auto leading-relaxed">
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
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c0d12]/90 p-6 text-left backdrop-blur-xl shadow-xl shadow-black/40 transition-all hover:border-[#8f7cff]/50 hover:bg-[#121218] hover:shadow-[#8f7cff]/10 focus:outline-none focus:ring-2 focus:ring-[#8f7cff]/30"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#b9a9ff] transition group-hover:border-[#8f7cff]/40 group-hover:bg-[#8f7cff]/15 group-hover:text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider text-[#9d9da8]">
                        {role.badge}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#b9a9ff] transition-colors">
                      {role.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#9d9da8] leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center font-mono text-xs font-semibold text-[#b9a9ff] group-hover:text-white transition-colors">
                    <span>Continue as {role.title.split(" ")[0]}</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center font-mono text-xs text-[#9d9da8] pt-4">
            Need a new account?{" "}
            <Link
              href="/signup"
              className="text-[#b9a9ff] hover:text-white hover:underline transition-colors"
            >
              Sign up here →
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
              className="inline-flex items-center gap-1.5 font-mono text-xs text-[#9d9da8] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Change role</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#6f6f7b]">Role selected:</span>
              <Badge variant="default" className="font-mono text-xs uppercase font-semibold">
                {currentRoleConfig?.title}
              </Badge>
            </div>
          </div>

          {/* Quick Demo Chips for selected role only */}
          <div className="rounded-2xl border border-[#8f7cff]/20 bg-[#8f7cff]/[0.06] p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#b9a9ff]">
              <Zap className="h-4 w-4" />
              <span>
                One-Click Quick Login ({currentRoleConfig?.title})
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#9d9da8]">
              Pre-configured demo accounts for the <strong className="text-white">{currentRoleConfig?.title}</strong> role:
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS_BY_ROLE[selectedRole].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLoginChip(acc.email)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#0c0d12] px-3.5 py-2 text-xs font-mono text-white/90 shadow-sm transition hover:border-[#8f7cff]/50 hover:bg-[#121218] hover:text-white"
                >
                  <span>{acc.label}</span>
                  <Badge variant="subtle" className="text-[10px] px-1.5 py-0 border-white/[0.08] bg-white/[0.05]">
                    {acc.badge}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Role Mismatch Error Alert */}
          {roleMismatchError && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-200 flex items-start gap-3 backdrop-blur-md">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-mono font-bold uppercase tracking-wider text-rose-300">Role Verification Failed</p>
                <p className="mt-0.5 text-white/90">{roleMismatchError}</p>
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="font-mono text-xs text-[#b9a9ff] hover:text-white transition-colors"
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
                  className="w-full text-sm font-semibold h-11"
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
