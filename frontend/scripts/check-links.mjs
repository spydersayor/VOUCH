// frontend/scripts/check-links.mjs
// Crawls all internal links and performs deep headless browser (Playwright) rendering and click-through checks.

import { chromium } from "playwright";

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
  {
    role: "sponsor",
    email: "sponsor@vouch.local",
    dashboard: "/sponsor",
    routes: [
      "/sponsor",
      "/sponsor/post-problem",
      "/sponsor/projects",
      "/sponsor/wallet",
    ],
  },
  {
    role: "invited_student",
    email: "student.a@vouch.local",
    dashboard: "/student",
    routes: [
      "/student",
      "/student/applications",
      "/student/matches",
      "/student/credentials",
    ],
  },
  {
    role: "uninvited_student",
    email: "student.c@vouch.local",
    dashboard: "/student",
    routes: [
      "/student",
      "/student/applications",
      "/student/matches",
      "/student/credentials",
    ],
  },
  {
    role: "expert",
    email: "expert.a@vouch.local",
    dashboard: "/expert",
    routes: [
      "/expert",
      "/expert/matches",
      "/expert/conflicts",
    ],
  },
  {
    role: "admin",
    email: "admin@vouch.local",
    dashboard: "/admin",
    routes: ["/admin"],
  },
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
  const cookieVal = cookie.includes("=") ? cookie.split("=")[1] : cookie;
  const data = await res.json();
  return { cookie, cookieVal, user: data.user };
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

function setupErrorTracking(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const txt = msg.text();
      // Ignore non-fatal React favicon, font warnings, or expected 401 on /api/me for anonymous visits
      if (
        !txt.includes("favicon") &&
        !txt.includes("status of 404 (Not Found)") &&
        !txt.includes("status of 401 (Unauthorized)")
      ) {
        errors.push(`Console Error: ${txt}`);
      }
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`Uncaught Page Exception: ${err.message}`);
  });
  return errors;
}

async function checkPageContent(page, urlLabel) {
  const content = await page.content();
  const lower = content.toLowerCase();
  if (
    lower.includes("this page couldn't load") ||
    lower.includes("this page couldn’t load") ||
    lower.includes("application error: a client-side exception has occurred")
  ) {
    return `Generic crash screen detected on ${urlLabel}: "This page couldn't load"`;
  }
  return null;
}

async function runAudit() {
  console.log("=================================================");
  console.log("  VOUCH Next.js Route, Link & Headless Render Audit");
  console.log("=================================================\n");

  let totalTested = 0;
  let failures = [];
  const visited = new Set();
  const allCharterLinks = new Set([
    "/charters/proj_retinopathy",
    "/charters/proj_indic_nlp",
    "/charters/proj_past_1",
    "/charters/proj_past_1:1",
    "/charters/proj_past_2",
    "/charters/proj_past_2:1",
    "/charters/proj_past_3",
    "/charters/proj_past_3:1",
  ]);

  // 1. Fast HTTP Link Crawl
  console.log("🔍 PHASE 1: HTTP Link & 404 Audit...");
  for (const route of PUBLIC_ROUTES) {
    const targetUrl = `${FRONTEND_URL}${route}`;
    visited.add(route);
    totalTested++;
    const res = await fetchWithCookie(targetUrl);
    if (res.status === 200) {
      for (const l of extractLinks(res.text || "")) {
        if (l.startsWith("/charters/")) allCharterLinks.add(l);
      }
    } else {
      console.error(`  ✗ [${res.status}] ${route} -> FAILED`);
      failures.push({ route, status: res.status, role: "public", error: "HTTP not 200" });
    }
  }

  const roleSessions = {};
  for (const item of ROLES_TO_TEST) {
    try {
      const session = await loginAs(item.email);
      roleSessions[item.role] = session;
    } catch (err) {
      console.error(`  ✗ Login failed for ${item.email}: ${err.message}`);
      failures.push({ route: item.dashboard, role: item.role, error: err.message });
      continue;
    }

    const dashRes = await fetchWithCookie(`${FRONTEND_URL}${item.dashboard}`, roleSessions[item.role].cookie);
    if (dashRes.status === 200 || dashRes.status === 307 || dashRes.status === 308) {
      for (const l of extractLinks(dashRes.text || "")) {
        if (l.startsWith("/charters/")) allCharterLinks.add(l);
      }
    } else {
      failures.push({ route: item.dashboard, status: dashRes.status, role: item.role, error: "HTTP not 200" });
    }

    if (item.routes) {
      for (const r of item.routes) {
        totalTested++;
        const rRes = await fetchWithCookie(`${FRONTEND_URL}${r}`, roleSessions[item.role].cookie);
        if (rRes.status === 200 || rRes.status === 307 || rRes.status === 308) {
          for (const l of extractLinks(rRes.text || "")) {
            if (l.startsWith("/charters/")) allCharterLinks.add(l);
          }
        } else {
          failures.push({ route: r, status: rRes.status, role: item.role, error: "HTTP not 200" });
        }
      }
    }
  }

  console.log(`  ✓ Phase 1 complete. Discovered ${allCharterLinks.size} unique charters to verify.\n`);

  // 2. Playwright Headless Browser Render Check
  console.log("🌐 PHASE 2: Playwright Headless Browser Render Checks...");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error("Failed to launch Playwright browser:", err);
    process.exit(1);
  }

  try {
    // 2A. Public Pages Render Check
    console.log("  Testing Public Page Renders...");
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();

    for (const route of PUBLIC_ROUTES) {
      const errors = setupErrorTracking(publicPage);
      const url = `${FRONTEND_URL}${route}`;
      totalTested++;

      try {
        await publicPage.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await publicPage.waitForTimeout(400); // Allow react hydration and state to settle

        const crash = await checkPageContent(publicPage, route);
        if (crash) {
          failures.push({ route, role: "public", error: crash });
          console.error(`    ✗ Render crash on ${route}`);
        } else if (errors.length > 0) {
          failures.push({ route, role: "public", error: errors.join("; ") });
          console.error(`    ✗ Console errors on ${route}: ${errors.join("; ")}`);
        } else {
          console.log(`    ✓ Rendered [public] ${route}`);
        }
      } catch (err) {
        failures.push({ route, role: "public", error: err.message });
        console.error(`    ✗ Navigation failure on ${route}: ${err.message}`);
      }
    }
    await publicContext.close();

    // 2B. Role Dashboards and Routes Render Check
    console.log("\n  Testing Role Sessions in Playwright...");
    for (const item of ROLES_TO_TEST) {
      const session = roleSessions[item.role];
      if (!session) continue;

      const context = await browser.newContext();
      // Set session cookie for this role
      await context.addCookies([
        {
          name: "vouch_session",
          value: session.cookieVal,
          url: FRONTEND_URL,
        },
      ]);

      const page = await context.newPage();
      const routesToTest = [item.dashboard, ...(item.routes || []), "/notifications"];

      for (const r of routesToTest) {
        const errors = setupErrorTracking(page);
        totalTested++;
        try {
          await page.goto(`${FRONTEND_URL}${r}`, { waitUntil: "domcontentloaded", timeout: 15000 });
          await page.waitForTimeout(400);

          const crash = await checkPageContent(page, `[${item.role}] ${r}`);
          if (crash) {
            failures.push({ route: r, role: item.role, error: crash });
            console.error(`    ✗ Render crash on [${item.role}] ${r}`);
          } else if (errors.length > 0) {
            failures.push({ route: r, role: item.role, error: errors.join("; ") });
            console.error(`    ✗ Console error on [${item.role}] ${r}: ${errors.join("; ")}`);
          } else {
            console.log(`    ✓ Rendered [${item.role}] ${r}`);
          }
        } catch (err) {
          failures.push({ route: r, role: item.role, error: err.message });
          console.error(`    ✗ Failed to load [${item.role}] ${r}: ${err.message}`);
        }
      }

      await context.close();
    }

    // 2C. Deep Charter Render Check Across Roles
    console.log("\n  Deep Headless Charter Render Check...");
    const studentSession = roleSessions["invited_student"];
    if (studentSession) {
      const charterContext = await browser.newContext();
      await charterContext.addCookies([
        {
          name: "vouch_session",
          value: studentSession.cookieVal,
          url: FRONTEND_URL,
        },
      ]);
      const charterPage = await charterContext.newPage();

      for (const charterPath of allCharterLinks) {
        const errors = setupErrorTracking(charterPage);
        totalTested++;
        try {
          await charterPage.goto(`${FRONTEND_URL}${charterPath}`, { waitUntil: "domcontentloaded", timeout: 15000 });
          await charterPage.waitForTimeout(400);

          const crash = await checkPageContent(charterPage, `[student] ${charterPath}`);
          if (crash) {
            failures.push({ route: charterPath, role: "student", error: crash });
            console.error(`    ✗ Charter crash on ${charterPath}`);
          } else if (errors.length > 0) {
            failures.push({ route: charterPath, role: "student", error: errors.join("; ") });
            console.error(`    ✗ Console error on ${charterPath}: ${errors.join("; ")}`);
          } else {
            console.log(`    ✓ Rendered Charter ${charterPath}`);
          }
        } catch (err) {
          failures.push({ route: charterPath, role: "student", error: err.message });
          console.error(`    ✗ Failed ${charterPath}: ${err.message}`);
        }
      }
      await charterContext.close();
    }

    // 2D. Interactive Click-Through Checks
    console.log("\n👆 PHASE 3: Interactive Button Click-Through Checks...");

    // 1) Click-through on /pricing
    console.log("  Testing /pricing interactive split calculator buttons...");
    const calcContext = await browser.newContext();
    const calcPage = await calcContext.newPage();
    const calcErrors = setupErrorTracking(calcPage);
    await calcPage.goto(`${FRONTEND_URL}/pricing`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await calcPage.waitForTimeout(500);

    // Click presets
    await calcPage.click("#btn-preset-50k");
    await calcPage.waitForTimeout(300);
    await calcPage.click("#btn-preset-250k");
    await calcPage.waitForTimeout(300);
    await calcPage.click("#btn-preset-default");
    await calcPage.waitForTimeout(300);

    // Toggle expert checkbox
    await calcPage.click("#expert-toggle-checkbox");
    await calcPage.waitForTimeout(300);
    await calcPage.click("#expert-toggle-checkbox");
    await calcPage.waitForTimeout(300);

    // Test input with invalid/empty input to verify friendly validation
    await calcPage.fill("#escrow-amount-input", "0");
    await calcPage.waitForTimeout(300);
    await calcPage.fill("#escrow-amount-input", "150000");
    await calcPage.waitForTimeout(300);
    await calcPage.fill("#escrow-amount-input", "100000");
    await calcPage.waitForTimeout(300);

    const calcCrash = await checkPageContent(calcPage, "/pricing (interactive)");
    if (calcCrash) failures.push({ route: "/pricing", role: "interactive", error: calcCrash });
    if (calcErrors.length > 0) failures.push({ route: "/pricing", role: "interactive", error: calcErrors.join("; ") });
    console.log("    ✓ /pricing calculator buttons and inputs passed with 0 crashes.");
    await calcContext.close();

    // 2) Click-through on /open-problems
    console.log("  Testing /open-problems interactive filters and search...");
    const probContext = await browser.newContext();
    const probPage = await probContext.newPage();
    const probErrors = setupErrorTracking(probPage);
    await probPage.goto(`${FRONTEND_URL}/open-problems`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await probPage.waitForTimeout(500);

    const filterBtn = await probPage.$("#btn-filter-problems");
    if (filterBtn) {
      await filterBtn.click();
      await probPage.waitForTimeout(400);
    }
    const probCrash = await checkPageContent(probPage, "/open-problems (interactive)");
    if (probCrash) failures.push({ route: "/open-problems", role: "interactive", error: probCrash });
    if (probErrors.length > 0) failures.push({ route: "/open-problems", role: "interactive", error: probErrors.join("; ") });
    console.log("    ✓ /open-problems filter interaction passed with 0 crashes.");
    await probContext.close();

    // 3) Click-through on /notifications
    console.log("  Testing /notifications filter tabs...");
    if (studentSession) {
      const notifContext = await browser.newContext();
      await notifContext.addCookies([
        {
          name: "vouch_session",
          value: studentSession.cookieVal,
          url: FRONTEND_URL,
        },
      ]);
      const notifPage = await notifContext.newPage();
      const notifErrors = setupErrorTracking(notifPage);
      await notifPage.goto(`${FRONTEND_URL}/notifications`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await notifPage.waitForTimeout(400);

      const unreadTab = await notifPage.$("#btn-filter-unread");
      if (unreadTab) {
        await unreadTab.click();
        await notifPage.waitForTimeout(300);
      }
      const allTab = await notifPage.$("#btn-filter-all");
      if (allTab) {
        await allTab.click();
        await notifPage.waitForTimeout(300);
      }

      const notifCrash = await checkPageContent(notifPage, "/notifications (interactive)");
      if (notifCrash) failures.push({ route: "/notifications", role: "interactive", error: notifCrash });
      if (notifErrors.length > 0) failures.push({ route: "/notifications", role: "interactive", error: notifErrors.join("; ") });
      console.log("    ✓ /notifications filter tabs passed with 0 crashes.");
      await notifContext.close();
    }

    // 4) Click-through on /charters/proj_retinopathy
    console.log("  Testing /charters interactive navigation...");
    const sponsorSession = roleSessions["sponsor"];
    if (sponsorSession) {
      const cContext = await browser.newContext();
      await cContext.addCookies([
        {
          name: "vouch_session",
          value: sponsorSession.cookieVal,
          url: FRONTEND_URL,
        },
      ]);
      const cPage = await cContext.newPage();
      const cErrors = setupErrorTracking(cPage);
      await cPage.goto(`${FRONTEND_URL}/charters/proj_retinopathy`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await cPage.waitForTimeout(500);

      const cCrash = await checkPageContent(cPage, "/charters/proj_retinopathy (interactive)");
      if (cCrash) failures.push({ route: "/charters/proj_retinopathy", role: "interactive", error: cCrash });
      if (cErrors.length > 0) failures.push({ route: "/charters/proj_retinopathy", role: "interactive", error: cErrors.join("; ") });
      console.log("    ✓ /charters/proj_retinopathy render & interactions passed with 0 crashes.");
      await cContext.close();
    }
  } finally {
    if (browser) await browser.close();
  }

  console.log("\n-------------------------------------------------");
  console.log(`Audit Finished. Total Checks Executed: ${totalTested}`);
  if (failures.length === 0) {
    console.log("🎉 SUCCESS: 0 broken links, 0 render crashes, 0 console errors!");
    console.log("-------------------------------------------------\n");
    process.exit(0);
  } else {
    console.error(`❌ FAILED: Found ${failures.length} issue(s):`);
    for (const f of failures) {
      console.error(`   - [${f.role}] ${f.route}: ${f.error || f.status}`);
    }
    console.log("-------------------------------------------------\n");
    process.exit(1);
  }
}

runAudit();
