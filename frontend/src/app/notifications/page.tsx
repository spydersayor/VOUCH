"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Filter,
  CheckCheck,
  FileText,
  Coins,
  Star,
  AlertTriangle,
  Shield,
} from "lucide-react";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    user,
  } = useAuth();

  const [filter, setFilter] = useState<"all" | "unread">("all");

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
          <Card className="p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
              No notifications found
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : "No notifications have been recorded for your account yet."}
            </p>
          </Card>
        ) : (
          filtered.map((n) => {
            const Icon = getIcon(n.title);
            const isUnread = !n.read;
            const targetUrl = n.link || (user ? `/${user.role}` : "/");

            return (
              <Card
                key={n.id}
                className={`transition-all hover:shadow-md ${
                  isUnread
                    ? "border-teal-200 bg-teal-50/40 dark:border-teal-900 dark:bg-teal-950/20"
                    : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        isUnread
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-1">
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
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {new Date(n.created_at).toLocaleString()}
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
  );
}
