"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { SectionErrorBoundary } from "@/components/common/SectionErrorBoundary";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  CheckCheck,
  FileText,
  Coins,
  Star,
  AlertTriangle,
} from "lucide-react";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("charter")) return FileText;
    if (t.includes("payout") || t.includes("honorarium") || t.includes("escrow"))
      return Coins;
    if (t.includes("star") || t.includes("rating")) return Star;
    if (t.includes("conflict") || t.includes("integrity") || t.includes("flag"))
      return AlertTriangle;
    return Bell;
  };

  return (
    <SectionErrorBoundary sectionName="NotificationsPage">
      <div className="min-h-[calc(100vh-4rem)] bg-[#050508] text-white py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6 animate-fade-up">
          {/* Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <Badge variant="flagged" className="text-xs font-mono">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Real-time milestone alerts, charter updates, and cryptographic verification receipts.
              </p>
            </div>

            {unreadCount > 0 && (
              <Button
                id="btn-mark-all-read"
                variant="outline"
                size="sm"
                onClick={markAllNotificationsRead}
                className="flex items-center gap-1.5 font-mono text-xs border-white/10 hover:border-violet-500/30 hover:bg-white/[0.04]"
              >
                <CheckCheck className="h-4 w-4 text-[#b9a9ff]" />
                <span>Mark all as read</span>
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <button
              id="btn-filter-all"
              onClick={() => setFilter("all")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-mono transition ${
                filter === "all"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>All</span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                {notifications.length}
              </span>
            </button>

            <button
              id="btn-filter-unread"
              onClick={() => setFilter("unread")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-mono transition ${
                filter === "unread"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>Unread</span>
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                {unreadCount}
              </span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card className="text-center py-16 border-white/[0.08] bg-[#0c0d12]/90 backdrop-blur-md">
                <CardContent className="space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-[#b9a9ff] border border-violet-500/20">
                    <CheckCircle2 className="h-6 w-6 text-[#b9a9ff]" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {filter === "unread" ? "You're all caught up!" : "No notifications yet"}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {filter === "unread"
                      ? "There are no unread notifications waiting for your review."
                      : "Activity on your applications, charters, escrows, and disputes will show up here."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((n) => {
                const Icon = getIcon(n.title);
                const isUnread = !n.read;
                const targetUrl = n.link || "/notifications";

                return (
                  <Card
                    key={n.id}
                    className={`transition border-l-4 bg-[#0c0d12]/90 backdrop-blur-md ${
                      isUnread
                        ? "border-l-violet-500 border-white/[0.08] shadow-lg shadow-violet-500/5"
                        : "border-l-transparent border-white/[0.04] opacity-80"
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isUnread
                              ? "bg-violet-500/20 text-[#b9a9ff] border border-violet-500/30"
                              : "bg-[#121218] text-zinc-500 border border-white/[0.04]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">
                              {n.title}
                            </h4>
                            {isUnread && (
                              <Badge variant="flagged" className="text-[9px] px-1.5 py-0 font-mono">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
                            {n.message}
                          </p>
                          <span className="text-[10px] font-mono text-zinc-500 block pt-0.5" suppressHydrationWarning>
                            {mounted ? new Date(n.created_at).toLocaleString() : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isUnread && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markNotificationRead(n.id)}
                            className="text-xs font-mono border-white/10 hover:bg-white/[0.04] text-zinc-300"
                          >
                            Mark read
                          </Button>
                        )}

                        <Button variant="default" size="sm" asChild className="font-bold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-400/30">
                          <Link
                            href={targetUrl}
                            onClick={() => {
                              if (isUnread) markNotificationRead(n.id);
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <span>Open</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </SectionErrorBoundary>
  );
}
