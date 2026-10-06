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
  CheckCircle2,
  MailCheck,
  ShieldCheck,
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
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Card className="animate-fade-up">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-[#b9a9ff]">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl">Create Your VOUCH Account</CardTitle>
          <CardDescription>
            Join the provable collaboration network with cryptographic audit guarantees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Role Selection Cards */}
            <div>
              <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8] block mb-3">
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
                      className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-[#8f7cff] bg-[#8f7cff]/[0.12] shadow-lg shadow-[#8f7cff]/10"
                          : "border-white/[0.08] bg-[#0c0d12]/60 hover:border-white/[0.16] hover:bg-[#121218]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                            isSelected
                              ? "border-[#8f7cff]/40 bg-[#8f7cff]/20 text-white"
                              : "border-white/[0.08] bg-white/[0.04] text-[#9d9da8]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-[#b9a9ff]" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-[#9d9da8] mt-1 line-clamp-2 leading-relaxed">
                        {r.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Newbie Badge Callout */}
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <Badge variant="warning" className="shrink-0 text-[10px] font-mono font-bold uppercase tracking-wider">
                NEWBIE BADGE
              </Badge>
              <span className="leading-relaxed">
                All new accounts automatically receive the <strong className="text-white">Newbie Badge</strong> and an exploration matching boost to build verified history.
              </span>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
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
                  <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
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
                <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
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
                <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
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
                <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9d9da8]">
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
              <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs text-[#9d9da8]">
                <MailCheck className="h-4 w-4 text-[#b9a9ff] shrink-0" />
                <span className="flex-1">
                  <strong className="text-white">Simulated Email Verification:</strong> Verification link will be auto-confirmed instantly in this demo sandbox.
                </span>
                <Badge variant="subtle" className="font-mono text-[10px] text-[#b9a9ff] border-[#8f7cff]/30 bg-[#8f7cff]/10">
                  AUTO-PASS
                </Badge>
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="w-full text-sm font-semibold h-11"
            >
              {loading
                ? "Creating Account..."
                : `Create ${role === "sponsor" ? "Sponsor" : role === "expert" ? "Expert" : "Student"} Account`}
            </Button>
          </form>

          <div className="mt-6 text-center font-mono text-xs text-[#9d9da8]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#b9a9ff] hover:text-white hover:underline transition-colors"
            >
              Log in with role selection →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
