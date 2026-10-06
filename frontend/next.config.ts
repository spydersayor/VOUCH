import type { NextConfig } from "next";

// In production set NEXT_PUBLIC_API_URL to your Render backend URL, e.g.:
//   https://vouch-backend.onrender.com
// Locally it falls back to the dev server so `python run.py` still works.
const apiBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
