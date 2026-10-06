// frontend/scripts/check-links.mjs
// Crawls all internal links across all roles and verifies zero 404s or errors.

import http from "node:http";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const PUBLIC_ROUTES = [
  "/",
  "/how-it-works",
  "/open-problems",
  "/pricing",
  "/faq",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/help",
  "/students",
  "/experts",
  "/companies",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const ROLES_TO_TEST = [
  { role: "student", email: "student.a@vouch.local", dashboard: "/student" },
  { role: "expert", email: "expert.a@vouch.local", dashboard: "/expert" },
  { role: "sponsor", email: "sponsor@vouch.local", dashboard: "/sponsor" },
  { role: "admin", email: "admin@vouch.local", dashboard: "/admin" },
];

async function fetchWithCookie(url, cookie = "") {
  try {
    const res = await fetch(url, {
      headers: {
        Cookie: cookie,
        "User-Agent": "VouchLinkAuditor/1.0",
      },
      redirect: "manual",
    });
    return { status: res.status, headers: res.headers, text: await res.text() };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function loginAs(email, password = "Password123!") {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Failed to log in as ${email}: ${res.statusText}`);
  }
  const setCookie = res.headers.get("set-cookie");
  const cookie = setCookie ? setCookie.split(";")[0] : "";
  const data = await res.json();
  return { cookie, user: data.user };
}

function extractLinks(html) {
  const links = new Set();
  const regex = /href=["'](\/[^"'#?]*)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const path = match[1];
    if (
      !path.startsWith("/_next") &&
      !path.startsWith("/api") &&
      !path.startsWith("/favicon")
    ) {
      links.add(path);
    }
  }
  return Array.from(links);
}

async function runAudit() {
  console.log("=================================================");
  console.log("  VOUCH Next.js Route & Link Audit (Zero 404s)");
  console.log("=================================================\n");

  let totalTested = 0;
  let failures = [];
  const visited = new Set();

  // 1. Audit Public Routes
  console.log("🔍 Checking Public Routes...");
  for (const route of PUBLIC_ROUTES) {
    const targetUrl = `${FRONTEND_URL}${route}`;
    visited.add(route);
    totalTested++;
    const res = await fetchWithCookie(targetUrl);
    if (res.status === 200) {
      console.log(`  ✓ [200] ${route}`);
    } else {
      console.error(`  ✗ [${res.status}] ${route} -> FAILED`);
      failures.push({ route, status: res.status, role: "public" });
    }
  }

  // 2. Audit Roles and Internal Links
  for (const item of ROLES_TO_TEST) {
    console.log(`\n🔑 Testing Role Session: ${item.role.toUpperCase()} (${item.email})`);
    let session;
    try {
      session = await loginAs(item.email);
    } catch (err) {
      console.error(`  ✗ Could not log in: ${err.message}`);
      failures.push({ route: item.dashboard, status: 0, error: err.message, role: item.role });
      continue;
    }

    // Check dashboard
    totalTested++;
    visited.add(item.dashboard);
    const dashRes = await fetchWithCookie(`${FRONTEND_URL}${item.dashboard}`, session.cookie);
    if (dashRes.status === 200) {
      console.log(`  ✓ [200] Dashboard: ${item.dashboard}`);
    } else {
      console.error(`  ✗ [${dashRes.status}] Dashboard: ${item.dashboard} -> FAILED`);
      failures.push({ route: item.dashboard, status: dashRes.status, role: item.role });
    }

    // Extract links in dashboard HTML
    const discovered = extractLinks(dashRes.text || "");
    for (const link of discovered) {
      if (visited.has(`${item.role}:${link}`)) continue;
      visited.add(`${item.role}:${link}`);
      totalTested++;

      const linkRes = await fetchWithCookie(`${FRONTEND_URL}${link}`, session.cookie);
      if (linkRes.status === 200 || linkRes.status === 307 || linkRes.status === 308) {
        console.log(`    ✓ [${linkRes.status}] Internal Link: ${link}`);
      } else {
        console.error(`    ✗ [${linkRes.status}] Internal Link: ${link} -> FAILED`);
        failures.push({ route: link, status: linkRes.status, role: item.role });
      }
    }
  }

  console.log("\n-------------------------------------------------");
  console.log(`Audit Finished. Total URLs Tested: ${totalTested}`);
  if (failures.length === 0) {
    console.log("🎉 SUCCESS: 0 broken links, 0 dead routes, 0 404s!");
    console.log("-------------------------------------------------\n");
    process.exit(0);
  } else {
    console.error(`❌ FAILED: Found ${failures.length} broken link(s):`);
    for (const f of failures) {
      console.error(`   - [${f.role}] ${f.route}: Status ${f.status} ${f.error || ""}`);
    }
    console.log("-------------------------------------------------\n");
    process.exit(1);
  }
}

runAudit();
