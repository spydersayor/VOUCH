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
    <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white flex items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-xl w-full animate-fade-up">
        <Card className="border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
          <CardHeader className="text-center pb-6 border-b border-white/[0.06]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-[#b9a9ff] border border-violet-500/20">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Contact VOUCH Platform</CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1">
              Inquiries are stored directly in the database and logged to the SHA-256 ledger.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center text-xs text-emerald-300 space-y-3">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Inquiry Recorded to Immutable Ledger</h3>
                <p className="text-zinc-300 leading-relaxed">
                  Your message has been received and timestamped. A platform administrator will review it shortly.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-mono border-white/10 hover:bg-white/[0.04] text-zinc-200 mt-2"
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
                  <label className="text-xs font-mono uppercase text-zinc-400">
                    Your Full Name
                  </label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    className="border-white/10 bg-[#121218] text-white placeholder-zinc-500 focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@institution.org"
                    className="border-white/10 bg-[#121218] text-white placeholder-zinc-500 focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400">
                    Subject
                  </label>
                  <Input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Pilot Capstone Sponsorship Inquiry"
                    className="border-white/10 bg-[#121218] text-white placeholder-zinc-500 focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-zinc-400">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Detail your research group, sponsor requirements, or questions..."
                    className="flex w-full rounded-xl border border-white/10 bg-[#121218] p-3 text-xs text-white placeholder-zinc-500 transition focus-visible:border-violet-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
                  />
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#121218]/60 p-3 text-[11px] text-zinc-400 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#b9a9ff] shrink-0" />
                  <span>Logs an immutable CONTACT_SUBMISSION block to the platform ledger.</span>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30 shadow-lg shadow-violet-600/20"
                >
                  {loading ? "Recording Message..." : "Submit Inquiry to Ledger"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
