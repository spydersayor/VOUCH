"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch, UserProfile } from "./api";
import { toast } from "sonner";

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  read: number;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  login: (email: string, password?: string, expectedRole?: string) => Promise<any>;
  signup: (payload: {
    email: string;
    password?: string;
    role: string;
    name: string;
    headline?: string;
    skills?: string[];
  }) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await apiFetch<{
        notifications: NotificationItem[];
        unread_count: number;
      }>("/api/notifications");
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // Ignored if unauthenticated
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await apiFetch<UserProfile>("/api/me");
      setUser(u);
      await refreshNotifications();
    } catch {
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password = "Password123!", expectedRole?: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ status: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const userRole = res.user.role;
      if (expectedRole && userRole !== expectedRole) {
        // Clear session immediately
        await apiFetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        const formatRole = (r: string) => {
          if (r === "sponsor") return "Company / Sponsor";
          return r.charAt(0).toUpperCase() + r.slice(1);
        };
        const errMsg = `This account is registered as a ${formatRole(userRole)}. Choose ${formatRole(userRole)} to continue.`;
        toast.error(errMsg);
        throw new Error(errMsg);
      }

      await refreshUser();
      toast.success(`Welcome back, ${res.user.name}!`);
      return res.user;
    } catch (err: any) {
      if (!err.message?.includes("registered as")) {
        toast.error(err.message || "Login failed");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: {
    email: string;
    password?: string;
    role: string;
    name: string;
    headline?: string;
    skills?: string[];
  }) => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ status: string; user: any }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          password: payload.password || "Password123!",
        }),
      });
      await refreshUser();
      toast.success("Account created successfully! Welcome to VOUCH.");
      return res.user;
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
      toast.success("Logged out successfully");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Logout failed");
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiFetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        notifications,
        unreadCount,
        login,
        signup,
        logout,
        refreshUser,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
