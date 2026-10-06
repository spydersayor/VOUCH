/**
 * Typed API Client for VOUCH Backend
 * Works seamlessly with proxy rewrites to http://127.0.0.1:8000
 * Same origin, automatic cookie inclusion, robust error propagation.
 */

import type { paths } from "./api-types";

export type ApiPaths = keyof paths;

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    ...options,
    credentials: "include", // strictly preserve httpOnly cookie sessions
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const res = await fetch(endpoint, config);

  let data: any;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = { detail: "Failed to parse JSON response" };
    }
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg =
      (typeof data === "object" && (data.detail || data.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// User Profile model matching /api/me
export interface UserProfile {
  id: string;
  email: string;
  role: "student" | "expert" | "sponsor" | "admin";
  name: string;
  headline?: string;
  skills: string[];
  interests: string[];
  stars: number | null;
  newbie_badge: boolean;
  is_kyc_verified: boolean;
  wallet_balance: number;
  avatar_initials?: string;
}
