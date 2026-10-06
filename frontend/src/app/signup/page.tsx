"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signup, user } = useAuth();
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [headline, setHeadline] = useState("");
  const [skillsStr, setSkillsStr] = useState("");
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
    <div className="mx-auto max-w-xl px-4 py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle>Create Your VOUCH Account</CardTitle>
          <CardDescription>
            Join as a Student, Expert, Sponsor, or Auditor on the provable network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Account Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="student">Student / Contributor (Newbie Badge)</option>
                <option value="expert">Expert Mentor (Guiding initiatives)</option>
                <option value="sponsor">Company Sponsor (Funding escrows)</option>
                <option value="admin">System Admin (Audit & Governance)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Full Name
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin"
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
                placeholder="name@university.edu"
              />
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
                placeholder="e.g. MS CS specializing in Computer Vision"
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

            <Button
              type="submit"
              variant="default"
              disabled={loading}
              className="w-full text-base font-bold"
            >
              {loading ? "Creating Account..." : "Create Account & Enter Platform"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-teal-600 hover:underline dark:text-teal-400"
            >
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
