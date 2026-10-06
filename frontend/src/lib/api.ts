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
    let errorMsg = `Request failed with status ${res.status}`;
    if (typeof data === "object" && data !== null) {
      if (typeof data.detail === "string") {
        errorMsg = data.detail;
      } else if (typeof data.detail === "object" && data.detail?.message) {
        errorMsg = data.detail.message;
      } else if (data.message) {
        errorMsg = data.message;
      }
    }
    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
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
