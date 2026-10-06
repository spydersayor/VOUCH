"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Mail, CheckCircle2, Send, Shield } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSubmitted(true);
      toast.success("Message recorded securely on the VOUCH ledger!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 animate-fade-up">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Contact VOUCH Platform</CardTitle>
          <CardDescription>
            Inquiries are stored directly in the database and logged to the SHA-256 ledger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 space-y-3">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold">Inquiry Recorded to Immutable Ledger</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Your message has been received and timestamped. A platform administrator will review it shortly.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmitted(false);
                  setName("");
                  setEmail("");
                  setSubject("");
                  setMessage("");
                }}
              >
                Send Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Your Full Name
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
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
                  placeholder="rajesh@institution.org"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Subject
                </label>
                <Input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Pilot Capstone Sponsorship Inquiry"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your research group, sponsor requirements, or questions..."
                  className="flex w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 transition focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Logs an immutable CONTACT_SUBMISSION block to the platform ledger.</span>
              </div>

              <Button
                type="submit"
                variant="default"
                disabled={loading}
                className="w-full font-bold"
              >
                {loading ? "Recording Message..." : "Submit Inquiry to Ledger"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
