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
      <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-up">
        {/* Top Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge variant="flagged" className="text-xs font-bold">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Real-time milestone alerts, charter updates, and cryptographic verification receipts.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              id="btn-mark-all-read"
              variant="outline"
              size="sm"
              onClick={markAllNotificationsRead}
              className="flex items-center gap-1.5 font-semibold"
            >
              <CheckCheck className="h-4 w-4 text-teal-600" />
              <span>Mark all as read</span>
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <button
            id="btn-filter-all"
            onClick={() => setFilter("all")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              filter === "all"
                ? "bg-teal-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              filter === "unread"
                ? "bg-teal-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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
            <Card className="text-center py-12">
              <CardContent className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {filter === "unread" ? "You're all caught up!" : "No notifications yet"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                  className={`transition border-l-4 ${
                    isUnread
                      ? "border-l-teal-600 bg-teal-50/20 dark:bg-teal-950/10 shadow-sm"
                      : "border-l-transparent opacity-85"
                  }`}
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isUnread
                            ? "bg-teal-600 text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {n.title}
                          </h4>
                          {isUnread && (
                            <Badge variant="flagged" className="text-[9px] px-1.5 py-0">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 block pt-0.5" suppressHydrationWarning>
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
                          className="text-xs font-semibold"
                        >
                          Mark read
                        </Button>
                      )}

                      <Button variant="default" size="sm" asChild className="font-bold">
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
    </SectionErrorBoundary>
  );
}
