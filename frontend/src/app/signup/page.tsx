"use client";

import React, { useState } from "react";
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
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  MailCheck,
} from "lucide-react";

type SignupRole = "student" | "expert" | "sponsor";

const SIGNUP_ROLES = [
  {
    id: "sponsor" as SignupRole,
    title: "Company / Sponsor",
    icon: Building2,
    badge: "Enterprise",
    desc: "Post briefs, lock rupee escrow, review milestones and verify IP.",
  },
  {
    id: "student" as SignupRole,
    title: "Student Contributor",
    icon: GraduationCap,
    badge: "Talent",
    desc: "Solve industry problems, receive rupee payouts, build provable proof.",
  },
  {
    id: "expert" as SignupRole,
    title: "Expert Mentor",
    icon: Sparkles,
    badge: "Advisor",
    desc: "Guide student squads, review technical quality, receive reward splits.",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { signup, user } = useAuth();
  const [role, setRole] = useState<SignupRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [headline, setHeadline] = useState("");
  const [skillsStr, setSkillsStr] = useState("");
  const [simulatedEmailVerified, setSimulatedEmailVerified] = useState(true);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      router.push(`/${user.role}`);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await signup({
        role,
        name,
        email,
        password,
        headline,
        skills,
      });
    } catch {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card className="animate-fade-up">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Create Your VOUCH Account</CardTitle>
          <CardDescription>
            Join the provable collaboration network with cryptographic audit guarantees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Role Selection Cards */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-2.5">
                Select Your Role (Admin is invite-only)
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SIGNUP_ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-teal-500 bg-teal-50/70 shadow-sm dark:border-teal-400 dark:bg-teal-950/40"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {r.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Newbie Badge Callout */}
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <Badge variant="warning" className="shrink-0 text-[10px] font-bold">
                NEWBIE BADGE
              </Badge>
              <span>
                All new accounts automatically receive the <strong>Newbie Badge</strong> and an exploration matching boost to build verified history.
              </span>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@iitb.ac.in"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Password
                </label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password123!"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Headline / Specialty
                </label>
                <Input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. MS CS specializing in Computer Vision & Edge AI"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Core Skills (comma separated)
                </label>
                <Input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="Python, PyTorch, Embedded Systems, OpenCV"
                />
              </div>

              {/* Simulated Email Verification */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                <MailCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="flex-1">
                  <strong>Simulated Email Verification:</strong> Verification link will be auto-confirmed instantly in this demo sandbox.
                </span>
                <Badge variant="subtle" className="text-[10px] text-teal-700 dark:text-teal-300">
                  AUTO-PASS
                </Badge>
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="w-full text-base font-bold"
            >
              {loading
                ? "Creating Account..."
                : `Create ${role === "sponsor" ? "Sponsor" : role === "expert" ? "Expert" : "Student"} Account`}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-teal-600 hover:underline dark:text-teal-400"
            >
              Log in with role selection
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
