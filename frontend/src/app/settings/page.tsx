"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleSidebar } from "@/components/shell/RoleSidebar";
import { toast } from "sonner";
import {
  Settings,
  User,
  Lock,
  Bell,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [requestingDelete, setRequestingDelete] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [skillsStr, setSkillsStr] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(20);

  // Notification toggles
  const [notifInvites, setNotifInvites] = useState(true);
  const [notifCharter, setNotifCharter] = useState(true);
  const [notifMilestones, setNotifMilestones] = useState(true);
  const [notifPayouts, setNotifPayouts] = useState(true);
  const [notifStars, setNotifStars] = useState(true);

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [deleteRequested, setDeleteRequested] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await apiFetch<any>("/api/user/settings");
        setName(res.name || "");
        setHeadline(res.headline || "");
        setSkillsStr((res.skills || []).join(", "));
        setWeeklyHours(res.weekly_hours || 20);
        setNotifInvites(Boolean(res.notifications?.invites ?? true));
        setNotifCharter(Boolean(res.notifications?.charter ?? true));
        setNotifMilestones(Boolean(res.notifications?.milestones ?? true));
        setNotifPayouts(Boolean(res.notifications?.payouts ?? true));
        setNotifStars(Boolean(res.notifications?.stars ?? true));
        setDeleteRequested(Boolean(res.delete_requested));
      } catch (err: any) {
        toast.error("Failed to load user settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const skillsArray = skillsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await apiFetch("/api/user/settings", {
        method: "PUT",
        body: JSON.stringify({
          name,
          headline,
          skills: skillsArray,
          weekly_hours: Number(weeklyHours),
          notification_invites: notifInvites,
          notification_charter: notifCharter,
          notification_milestones: notifMilestones,
          notification_payouts: notifPayouts,
          notification_stars: notifStars,
        }),
      });
      toast.success("Settings updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Please enter both current and new password");
      return;
    }
    setChangingPassword(true);
    try {
      await apiFetch("/api/user/change-password", {
        method: "POST",
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      toast.success("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!confirm("Are you sure you want to request account deletion? This action is logged to the ledger.")) {
      return;
    }
    setRequestingDelete(true);
    try {
      await apiFetch("/api/user/delete-request", { method: "POST" });
      setDeleteRequested(true);
      toast.success("Account deletion requested. Admin notified.");
    } catch (err: any) {
      toast.error(err.message || "Request failed");
    } finally {
      setRequestingDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please log in to manage your account settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Log In to Demo Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <RoleSidebar role={(user?.role || "student") as any} />
      <main className="flex-1 p-6 md:p-8 animate-fade-up">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 sm:text-3xl">
              Account Settings
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage your personal details, verified skill tags, password, and notification preferences.
            </p>
          </div>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Visible to team members and matched organizations on public project briefs.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Weekly Availability (Hours)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={80}
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Biomedical CV Researcher | TensorFlow Lite Specialist"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Verified Competency Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    placeholder="e.g. PyTorch, Computer Vision, FastAPI, Medical Imaging"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>

                {/* Notifications checkboxes */}
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-teal-600" />
                    <span>Notification Subscriptions</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={notifInvites}
                        onChange={(e) => setNotifInvites(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Project Match &amp; Application Invites</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={notifCharter}
                        onChange={(e) => setNotifCharter(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Charter Versioning &amp; Amendments</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={notifMilestones}
                        onChange={(e) => setNotifMilestones(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Milestone Approvals &amp; Expert Reviews</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={notifPayouts}
                        onChange={(e) => setNotifPayouts(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Escrow Payout Releases</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={notifStars}
                        onChange={(e) => setNotifStars(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Star Rating Changes &amp; Reviews</span>
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={savingProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  <span>{savingProfile ? "Saving..." : "Save Preferences"}</span>
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Lock className="h-5 w-5 text-teal-600" />
                <span>Security &amp; Password</span>
              </CardTitle>
              <CardDescription className="text-xs">
                PBKDF2 SHA-256 local salted hash encryption.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" variant="outline" disabled={changingPassword}>
                  {changingPassword ? "Updating..." : "Update Password"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Delete Account (Simulated) */}
          <Card className="border-rose-200 bg-rose-50/20 dark:border-rose-950 dark:bg-rose-950/10">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                <span>Account Deletion Request</span>
              </CardTitle>
              <CardDescription className="text-xs text-rose-600/80 dark:text-rose-400/70">
                Simulated GDPR deletion request. Anchored to audit ledger and queued for admin confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deleteRequested ? (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Deletion request has been submitted and registered in the ledger.</span>
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Requesting account closure revokes all active session tokens. All past milestone payouts
                  and verified ledger hashes remain permanently verifiable.
                </p>
              )}
            </CardContent>
            {!deleteRequested && (
              <CardFooter className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteRequest}
                  disabled={requestingDelete}
                >
                  {requestingDelete ? "Submitting..." : "Request Account Deletion"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
