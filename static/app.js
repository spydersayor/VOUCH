/**
 * VOUCH Client Application
 * Vanilla JS Hash Router, Adaptive Navbar, Auth State,
 * Live Ledger Verifier, and Role Dashboards.
 */

// Global State
const state = {
    user: null,
    notifications: [],
    unreadCount: 0,
    currentRoute: "",
};

// ===================== API Helper =====================
async function api(endpoint, options = {}) {
    const defaultHeaders = {
        "Content-Type": "application/json",
    };
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };
    if (config.body && typeof config.body === "object") {
        config.body = JSON.stringify(config.body);
    }
    const res = await fetch(endpoint, config);
    let data;
    try {
        data = await res.json();
    } catch (e) {
        data = { detail: "Failed to parse JSON response" };
    }
    if (!res.ok) {
        const errorMsg = data.detail || data.message || "An error occurred";
        throw new Error(errorMsg);
    }
    return data;
}

// ===================== Toast Notifications =====================
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// ===================== Auth Management =====================
async function checkAuth() {
    try {
        const user = await api("/api/me");
        state.user = user;
        await fetchNotifications();
    } catch (e) {
        state.user = null;
    }
    updateNavbar();
}

async function fetchNotifications() {
    if (!state.user) return;
    try {
        const res = await api("/api/notifications");
        state.notifications = res.notifications || [];
        state.unreadCount = res.unread_count || 0;
        updateNavbar();
    } catch (e) {
        console.error("Failed to fetch notifications", e);
    }
}

async function logout() {
    try {
        await api("/api/auth/logout", { method: "POST" });
        state.user = null;
        state.notifications = [];
        state.unreadCount = 0;
        showToast("Logged out successfully.", "success");
        navigate("#/");
    } catch (e) {
        showToast(e.message, "error");
    }
}

// ===================== Navbar Rendering =====================
function updateNavbar() {
    const authContainer = document.getElementById("nav-auth");
    if (!authContainer) return;

    if (state.user) {
        authContainer.innerHTML = `
            <div style="position: relative; display: flex; align-items: center; gap: 12px;">
                <button class="bell-btn" id="bell-toggle" aria-label="Notifications" title="Notifications">
                    🔔
                    ${state.unreadCount > 0 ? `<span class="bell-badge">${state.unreadCount}</span>` : ""}
                </button>
                <div class="notif-dropdown" id="notif-dropdown">
                    <div class="notif-header">
                        <h4>Notifications (${state.unreadCount} unread)</h4>
                        <button class="btn btn-outline btn-sm" id="mark-all-read-btn">Mark All Read</button>
                    </div>
                    <ul class="notif-list">
                        ${state.notifications.length === 0 ? `<li class="notif-item">No notifications yet.</li>` : 
                          state.notifications.slice(0, 6).map(n => `
                            <li class="notif-item ${n.read ? '' : 'unread'}">
                                <div class="notif-title">${escapeHtml(n.title)}</div>
                                <div>${escapeHtml(n.message)}</div>
                                <div class="notif-time">${new Date(n.created_at).toLocaleTimeString()}</div>
                            </li>
                        `).join("")}
                    </ul>
                    <div style="padding: 10px; text-align: center; border-top: 1px solid var(--border-subtle);">
                        <a href="#/notifications" style="font-size: 0.85rem; color: var(--primary-teal); font-weight: 600;">View All Notifications &rarr;</a>
                    </div>
                </div>

                <a href="#/dashboard" class="user-menu-pill" title="Role Dashboard">
                    <div class="user-avatar-sm">${escapeHtml(state.user.avatar_initials || state.user.name.substring(0, 2).toUpperCase())}</div>
                    <span class="user-pill-name">${escapeHtml(state.user.name.split(" ")[0])}</span>
                    <span class="user-pill-role">${escapeHtml(state.user.role)}</span>
                </a>

                <a href="#/settings" class="btn btn-outline btn-sm" title="Settings">⚙️</a>
                <button class="btn btn-secondary btn-sm" id="logout-btn">Log out</button>
            </div>
        `;

        document.getElementById("logout-btn")?.addEventListener("click", logout);
        
        // Bell toggle
        const bellToggle = document.getElementById("bell-toggle");
        const notifDropdown = document.getElementById("notif-dropdown");
        bellToggle?.addEventListener("click", (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
            if (!notifDropdown?.contains(e.target) && e.target !== bellToggle) {
                notifDropdown?.classList.remove("show");
            }
        });

        document.getElementById("mark-all-read-btn")?.addEventListener("click", async () => {
            await api("/api/notifications/read-all", { method: "POST" });
            await fetchNotifications();
            showToast("All notifications marked as read.", "success");
        });
    } else {
        authContainer.innerHTML = `
            <a href="#/login" class="btn btn-outline btn-sm">Log in</a>
            <a href="#/signup" class="btn btn-primary btn-sm">Sign up</a>
        `;
    }

    // Highlight active link
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === state.currentRoute);
    });
}

// ===================== Helper Functions =====================
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatRupees(amount) {
    return "Rs " + Number(amount || 0).toLocaleString("en-IN");
}

// ===================== Hash Router =====================
function navigate(hash) {
    window.location.hash = hash;
}

window.addEventListener("hashchange", handleRouting);
document.addEventListener("DOMContentLoaded", async () => {
    // Mobile menu toggle
    const mobileToggle = document.getElementById("mobile-toggle");
    const navMenu = document.getElementById("nav-menu");
    mobileToggle?.addEventListener("click", () => {
        const expanded = mobileToggle.getAttribute("aria-expanded") === "true";
        mobileToggle.setAttribute("aria-expanded", !expanded);
        navMenu.classList.toggle("open");
    });

    await checkAuth();
    handleRouting();
});

async function handleRouting() {
    const rawHash = window.location.hash || "#/";
    state.currentRoute = rawHash;
    updateNavbar();

    const main = document.getElementById("main-content");
    window.scrollTo(0, 0);

    // Dynamic routing
    if (rawHash === "#/" || rawHash === "") {
        renderHomePage(main);
    } else if (rawHash === "#/how-it-works") {
        renderHowItWorksPage(main);
    } else if (rawHash.startsWith("#/open-problems")) {
        renderOpenProblemsPage(main);
    } else if (rawHash === "#/students") {
        renderStudentsPage(main);
    } else if (rawHash === "#/experts") {
        renderExpertsPage(main);
    } else if (rawHash === "#/companies") {
        renderCompaniesPage(main);
    } else if (rawHash === "#/about") {
        renderAboutPage(main);
    } else if (rawHash === "#/faq") {
        renderFAQPage(main);
    } else if (rawHash === "#/contact") {
        renderContactPage(main);
    } else if (rawHash === "#/pricing") {
        renderPricingPage(main);
    } else if (rawHash === "#/terms") {
        renderTermsPage(main);
    } else if (rawHash === "#/privacy") {
        renderPrivacyPage(main);
    } else if (rawHash === "#/help") {
        renderHelpPage(main);
    } else if (rawHash === "#/login") {
        renderLoginPage(main);
    } else if (rawHash === "#/signup") {
        renderSignupPage(main);
    } else if (rawHash === "#/forgot-password") {
        renderForgotPasswordPage(main);
    } else if (rawHash === "#/reset-password") {
        renderResetPasswordPage(main);
    } else if (rawHash === "#/settings") {
        renderSettingsPage(main);
    } else if (rawHash === "#/notifications") {
        renderNotificationsPage(main);
    } else if (rawHash.startsWith("#/profile/")) {
        const userId = rawHash.replace("#/profile/", "");
        renderPublicProfilePage(main, userId);
    } else if (rawHash === "#/dashboard") {
        renderDashboardPage(main);
    } else {
        render404Page(main);
    }
}

// ===================== PAGE RENDERERS =====================

/** 1. Landing Page (SPEC.md Section 3) */
function renderHomePage(container) {
    container.innerHTML = `
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero-badge">
                <span class="badge badge-teal">PROOF OVER PROMISES</span>
            </div>
            <h1 class="hero-title">Work you can <span>prove</span>.</h1>
            <p class="hero-subtitle">
                The trust-first collaboration platform where student contributions unlock real milestone payouts,
                expert mentorship is credited, and every review is cryptographically anchored to an immutable ledger.
            </p>
            <div class="hero-ctas">
                <a href="#/open-problems" class="btn btn-primary btn-lg">Explore Open Problems</a>
                <a href="#/login" class="btn btn-secondary btn-lg">Quick Demo Login</a>
                <a href="#/how-it-works" class="btn btn-outline btn-lg">How It Works</a>
            </div>
        </section>

        <!-- Live Widget: Verify the Diary Now (SPEC.md Section 3 & 11) -->
        <section class="verify-widget" aria-label="Cryptographic Ledger Verifier">
            <div class="verify-widget-header">
                <div class="verify-widget-title">
                    <span>🛡️</span>
                    <span>Verify the Platform Diary</span>
                    <span class="badge badge-teal">LIVE LEDGER</span>
                </div>
                <button class="btn btn-outline btn-sm" id="btn-reverify">Re-verify Chain ↻</button>
            </div>
            <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 16px;">
                Every creation, charter acceptance, file hash, escrow funding, and star update is SHA-256 chained sequentially.
                Click below to audit every sequence in the local SQLite ledger.
            </p>
            <div class="verify-status-box" id="verify-status-box">
                Auditing cryptographic hash chain...
            </div>
        </section>

        <!-- The Problem in 3 Cards (SPEC.md Section 3) -->
        <section class="section">
            <div class="section-header">
                <span class="badge badge-coral">THE PROBLEM</span>
                <h2>Why Traditional Work Stacks Fail</h2>
                <p>Students and companies are trapped in unverified portfolios, broken promises, and ghosting.</p>
            </div>
            <div class="grid-3">
                <div class="card">
                    <div style="font-size: 2rem; margin-bottom: 12px;">💸</div>
                    <h3>No Pay</h3>
                    <p style="color: var(--text-muted);">
                        Students build production features disguised as "unpaid technical assessments" or unfulfilled internship promises with zero locked compensation.
                    </p>
                </div>
                <div class="card">
                    <div style="font-size: 2rem; margin-bottom: 12px;">👤</div>
                    <h3>No Credit</h3>
                    <p style="color: var(--text-muted);">
                        Student code and models get absorbed into proprietary repos with no attribution, co-authorship records, or verifiable proof of authorship.
                    </p>
                </div>
                <div class="card">
                    <div style="font-size: 2rem; margin-bottom: 12px;">📄</div>
                    <h3>No Proof</h3>
                    <p style="color: var(--text-muted);">
                        Resume bullet points and self-reported star ratings are trivially forged or inflated. Recruiters cannot tell genuine capability from fluff.
                    </p>
                </div>
            </div>
        </section>

        <!-- How it Works as a 6-Step Flow (SPEC.md Section 3) -->
        <section class="section" style="background: var(--bg-surface); padding: 48px 24px; border-radius: var(--radius-lg);">
            <div class="section-header">
                <span class="badge badge-teal">HOW IT WORKS</span>
                <h2>Six Steps from Challenge to Proof</h2>
                <p>A deterministic, rule-based lifecycle governed by code rather than guesswork.</p>
            </div>
            <div class="step-flow">
                <div class="step-card">
                    <div class="step-num">1</div>
                    <h3>Post</h3>
                    <p>Company defines public summary, confidential brief, budget, and engagement model.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">2</div>
                    <h3>Match</h3>
                    <p>Skill fit, verified past projects, and ratings rank students and experts without conflicts of interest.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">3</div>
                    <h3>Agree</h3>
                    <p>Members review and cryptographically accept versioned charters and engagement models.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">4</div>
                    <h3>Locker</h3>
                    <p>Company funds the simulated escrow locker before any funded milestone work begins.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">5</div>
                    <h3>Work</h3>
                    <p>Team collaborates under expert guidance with integrity checks and hash-logged artifacts.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">6</div>
                    <h3>Paid & Credited</h3>
                    <p>Milestone accepted; locker releases exact integer rupees; ratings and receipts update on ledger.</p>
                </div>
            </div>
        </section>

        <!-- Four Feature Cards (SPEC.md Section 3) -->
        <section class="section">
            <div class="section-header">
                <span class="badge badge-teal">GUARANTEES</span>
                <h2>Engineered for Verifiable Trust</h2>
                <p>Four foundational pillars ensure safety and zero ambiguity.</p>
            </div>
            <div class="grid-4">
                <div class="card">
                    <div style="font-size: 1.8rem; margin-bottom: 8px;">📓</div>
                    <h4>Provable Diary</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 6px;">
                        Every event auto-appends to the SHA-256 hash chain with actor, timestamp, and payload hash.
                    </p>
                </div>
                <div class="card">
                    <div style="font-size: 1.8rem; margin-bottom: 8px;">🔒</div>
                    <h4>Safe Locker</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 6px;">
                        Funds are locked before work starts and distributed per exact integer rupee formulas upon acceptance.
                    </p>
                </div>
                <div class="card">
                    <div style="font-size: 1.8rem; margin-bottom: 8px;">⭐</div>
                    <h4>Stars Backed by Receipts</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 6px;">
                        Ratings only stem from closed projects. Every score links to transparent pros, cons, and ledger entries.
                    </p>
                </div>
                <div class="card">
                    <div style="font-size: 1.8rem; margin-bottom: 8px;">🔮</div>
                    <h4>Rehearsal Engine</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 6px;">
                        Test what-if exit scenarios (e.g. member quits, sponsor withdraws) with mathematical rupee tables.
                    </p>
                </div>
            </div>
        </section>

        <!-- Role Sections for Students, Experts, Companies (SPEC.md Section 3) -->
        <section class="section">
            <div class="grid-3">
                <div class="card" style="border-top: 4px solid var(--primary-teal);">
                    <span class="badge badge-teal">FOR STUDENTS</span>
                    <h3 style="margin: 12px 0;">Build an Unshakeable Portfolio</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px;">
                        No more uncredited unpaid assignments. Earn fair rupee compensation, learn directly from vetted experts, and receive verifiable cryptographically anchored credentials.
                    </p>
                    <a href="#/students" class="btn btn-outline btn-sm">Explore Student Path &rarr;</a>
                </div>
                <div class="card" style="border-top: 4px solid var(--accent-coral);">
                    <span class="badge badge-coral">FOR EXPERTS</span>
                    <h3 style="margin: 12px 0;">Guide High-Impact Initiatives</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px;">
                        Mentorship with clear boundaries. Review submissions, advise on architectures, declare conflicts transparently, and earn 30% advisory shares and co-authorship.
                    </p>
                    <a href="#/experts" class="btn btn-outline btn-sm">Explore Expert Path &rarr;</a>
                </div>
                <div class="card" style="border-top: 4px solid #0f172a;">
                    <span class="badge badge-accent">FOR COMPANIES</span>
                    <h3 style="margin: 12px 0;">De-Risk Frontier R&D</h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px;">
                        Protect confidential datasets with server-side brief gating. Work with ranked students vetted by previous closed projects, with predictable milestone escrow.
                    </p>
                    <a href="#/companies" class="btn btn-outline btn-sm">Explore Company Path &rarr;</a>
                </div>
            </div>
        </section>

        <!-- Stats Strip clearly labelled "Demo data" (SPEC.md Section 3) -->
        <section class="stats-strip" aria-label="Demo Statistics">
            <div class="stats-strip-label">Platform Telemetry (Clearly Labelled: Demo Data)</div>
            <div class="stats-strip-grid">
                <div class="stat-item">
                    <h3>Rs 1,00,000</h3>
                    <p>Escrow Locked in Active Seed</p>
                </div>
                <div class="stat-item">
                    <h3>100%</h3>
                    <p>Cryptographic Chain Integrity</p>
                </div>
                <div class="stat-item">
                    <h3>7 Accounts</h3>
                    <p>Vetted Seed Personas Active</p>
                </div>
                <div class="stat-item">
                    <h3>0 LLM Calls</h3>
                    <p>Pure Offline Deterministic Logic</p>
                </div>
            </div>
        </section>

        <!-- FAQ Accordion (SPEC.md Section 3) -->
        <section class="section" style="max-width: 800px; margin: 0 auto;">
            <div class="section-header">
                <span class="badge badge-teal">FAQ</span>
                <h2>Frequently Asked Questions</h2>
            </div>
            <div class="accordion" id="faq-accordion">
                <div class="accordion-item">
                    <button class="accordion-trigger">
                        <span>How does the escrow locker guarantee payment?</span>
                        <span>+</span>
                    </button>
                    <div class="accordion-content">
                        Before any funded milestone starts, the company sponsor deposits the milestone budget into the project locker. Funds cannot be unilaterally retrieved without formal withdrawal penalties, ensuring student and expert work is guaranteed upon accepted delivery.
                    </div>
                </div>
                <div class="accordion-item">
                    <button class="accordion-trigger">
                        <span>Can an outsider view confidential project datasets?</span>
                        <span>+</span>
                    </button>
                    <div class="accordion-content">
                        No. The backend enforces server-side gating on /api/projects/:id/brief. Direct URL hits return 403 Forbidden unless the authenticated user has explicitly accepted the current charter version.
                    </div>
                </div>
                <div class="accordion-item">
                    <button class="accordion-trigger">
                        <span>What is the Newbie badge and exploration boost?</span>
                        <span>+</span>
                    </button>
                    <div class="accordion-content">
                        New accounts without closed projects receive a Newbie badge. Instead of false 0-star ratings, they display verified skills and receive a +5% exploration boost in matchmaking so beginners aren't shut out of initial opportunities.
                    </div>
                </div>
                <div class="accordion-item">
                    <button class="accordion-trigger">
                        <span>How does the ledger verify against database tampering?</span>
                        <span>+</span>
                    </button>
                    <div class="accordion-content">
                        Every entry's hash is computed from seq, timestamp, actor, action, payload hash, and the previous entry's hash. If someone directly alters a database row, GET /api/ledger/verify instantly catches the discrepancy and identifies the exact sequence number that was broken.
                    </div>
                </div>
            </div>
        </section>

        <!-- Final CTA -->
        <section class="section" style="text-align: center; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; border-radius: var(--radius-lg); padding: 60px 24px; margin: 40px 0;">
            <h2 style="font-size: 2.4rem; font-weight: 800; margin-bottom: 16px;">Ready to prove your capability?</h2>
            <p style="font-size: 1.15rem; max-width: 600px; margin: 0 auto 32px; opacity: 0.9;">
                Try out the live demonstration using any of the 7 pre-configured role profiles or explore current open problems.
            </p>
            <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
                <a href="#/login" class="btn btn-secondary btn-lg">Launch Demo Login</a>
                <a href="#/open-problems" class="btn btn-outline btn-lg" style="color: white; border-color: white;">Browse Problems</a>
            </div>
        </section>
    `;

    // Initialize Verify Widget
    initVerifyWidget();

    // Initialize Accordion
    initAccordion();
}

/** Helper: Verify Widget Logic */
async function initVerifyWidget() {
    const box = document.getElementById("verify-status-box");
    const reverifyBtn = document.getElementById("btn-reverify");
    if (!box) return;

    async function runVerification() {
        box.innerHTML = `<span style="color: var(--text-subtle);">Auditing SHA-256 chain links...</span>`;
        try {
            const data = await api("/api/ledger/verify");
            if (data.status === "ok") {
                box.innerHTML = `
                    <div class="verify-status-ok">✔ CRYPTOGRAPHIC INTEGRITY VERIFIED (OK)</div>
                    <div style="margin-top: 6px; font-size: 0.85rem; color: var(--text-muted);">
                        <strong>Entries Chained:</strong> ${data.count} sequential blocks<br>
                        <strong>Latest Block Hash:</strong> <span style="word-break: break-all;">${data.head_hash || "Genesis"}</span><br>
                        <strong>Status:</strong> Zero broken links detected across all project actions.
                    </div>
                `;
            } else {
                box.innerHTML = `
                    <div class="verify-status-tampered">✖ TAMPER ALERT DETECTED (BROKEN AT SEQ #${data.broken_seq})</div>
                    <div style="margin-top: 6px; font-size: 0.85rem; color: var(--accent-coral);">
                        <strong>Failure Reason:</strong> ${escapeHtml(data.reason)}<br>
                        <strong>Security Event:</strong> Signature or payload altered outside the immutable ledger protocol.
                    </div>
                `;
            }
        } catch (err) {
            box.innerHTML = `<span class="verify-status-tampered">Error contacting verification API: ${escapeHtml(err.message)}</span>`;
        }
    }

    reverifyBtn?.addEventListener("click", runVerification);
    await runVerification();
}

/** Helper: FAQ Accordion */
function initAccordion() {
    document.querySelectorAll(".accordion-trigger").forEach(btn => {
        btn.addEventListener("click", () => {
            const content = btn.nextElementSibling;
            const isOpen = content.classList.contains("active");
            document.querySelectorAll(".accordion-content").forEach(c => c.classList.remove("active"));
            document.querySelectorAll(".accordion-trigger span:last-child").forEach(s => s.textContent = "+");
            if (!isOpen) {
                content.classList.add("active");
                btn.querySelector("span:last-child").textContent = "−";
            }
        });
    });
}

/** 2. How It Works Page */
function renderHowItWorksPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">ARCHITECTURE & STORY</span>
            <h1>How VOUCH Works</h1>
            <p>From initial problem scoping to ledger-verified payout and credentialing.</p>
        </div>
        
        <div class="card" style="margin-bottom: 32px;">
            <h3>The Six Deterministic Stages</h3>
            <div class="step-flow" style="margin-top: 20px;">
                <div class="step-card">
                    <div class="step-num">1</div>
                    <h4>Post Problem</h4>
                    <p>Company outlines objectives, confidential brief, and budget. Scoping splits budget into clear milestones.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">2</div>
                    <h4>Algorithmic Match</h4>
                    <p>Deterministic formula weights skills, verified similar projects, stars, and availability with pros and cons.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">3</div>
                    <h4>Charter Agreement</h4>
                    <p>Members formally accept the versioned charter and engagement model, unlocking confidential datasets.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">4</div>
                    <h4>Escrow Locker</h4>
                    <p>Company deposits rupees into the milestone escrow locker. No work commences without locked funds.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">5</div>
                    <h4>Collaboration & Checks</h4>
                    <p>Submissions pass 3-word shingle similarity checks and AI disclosures before expert review.</p>
                </div>
                <div class="step-card">
                    <div class="step-num">6</div>
                    <h4>Exact Rupee Release</h4>
                    <p>Milestone accepted releases 10% platform, 5% AI reserve, 30% expert, and 70% student split down to integer rupees.</p>
                </div>
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <h3>Confidential Brief Gating</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">
                    Confidential datasets and clinical details are never sent over the wire until a candidate is accepted and has signed the current charter version. Any update to the charter creates a new version that revokes access until re-accepted.
                </p>
            </div>
            <div class="card">
                <h3>Exit Rules & Rehearsal</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">
                    If a student quits, unearned funds return to the remaining pool, while pro-rata earned rupees stay theirs. If a sponsor withdraws, 100% of remaining funds go to the team plus a 10% penalty compensation fee.
                </p>
            </div>
        </div>
    `;
}

/** 3. Open Problems Page with Filters (SPEC.md Section 3) */
async function renderOpenProblemsPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">PUBLIC DIRECTORY</span>
            <h1>Open Problems</h1>
            <p>Real-world initiatives ready for student teams and expert guidance.</p>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 16px; align-items: end;">
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">Search by Skill or Title</label>
                    <input type="text" class="form-input" id="filter-skill" placeholder="e.g. PyTorch, OpenCV, NLP...">
                </div>
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">Engagement Model</label>
                    <select class="form-select" id="filter-model">
                        <option value="all">All Models</option>
                        <option value="funded">Funded</option>
                        <option value="knowledge-sharing">Knowledge Sharing</option>
                        <option value="stipend">Stipend</option>
                        <option value="institutional-credit">Institutional Credit</option>
                    </select>
                </div>
                <div class="form-group" style="margin: 0;">
                    <label class="form-label">Min Budget (Rs)</label>
                    <input type="number" class="form-input" id="filter-budget" placeholder="0" min="0" step="10000">
                </div>
                <button class="btn btn-primary" id="btn-apply-filter" style="height: 42px;">Filter</button>
            </div>
        </div>

        <!-- Projects Grid -->
        <div id="projects-grid" class="grid-2">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `;

    async function loadProjects() {
        const grid = document.getElementById("projects-grid");
        const skill = document.getElementById("filter-skill")?.value || "";
        const model = document.getElementById("filter-model")?.value || "all";
        const budget = document.getElementById("filter-budget")?.value || "";

        let query = `/api/projects?`;
        if (skill) query += `skill=${encodeURIComponent(skill)}&`;
        if (model !== "all") query += `engagement_model=${encodeURIComponent(model)}&`;
        if (budget) query += `min_budget=${encodeURIComponent(budget)}&`;

        try {
            const data = await api(query);
            if (!data.projects || data.projects.length === 0) {
                grid.innerHTML = `
                    <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
                        <h3>No projects match your filter criteria.</h3>
                        <p style="color: var(--text-muted); margin-top: 8px;">Try clearing filters or search terms.</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = data.projects.map(p => `
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <span class="badge ${p.engagement_model === 'funded' ? 'badge-teal' : 'badge-gold'}">
                                ${p.engagement_model.toUpperCase()}
                            </span>
                            <span style="font-weight: 800; color: var(--primary-teal); font-size: 1.1rem;">
                                ${p.budget > 0 ? formatRupees(p.budget) : 'Institutional Credit'}
                            </span>
                        </div>
                        <h3 style="font-size: 1.25rem; margin-bottom: 8px;">${escapeHtml(p.title)}</h3>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
                            <strong>Sponsor:</strong> <a href="#/profile/${p.sponsor_id}" style="color: var(--primary-teal);">${escapeHtml(p.sponsor_name)}</a> 
                            (${p.sponsor_stars} ⭐)
                        </div>
                        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 16px;">
                            ${escapeHtml(p.public_summary)}
                        </p>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                            ${(p.required_skills || []).map(s => `<span class="badge badge-accent" style="background: var(--bg-surface); color: var(--text-muted); font-size: 0.7rem;">${escapeHtml(s)}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
                        <span style="font-size: 0.8rem; color: var(--text-subtle);">Confidential Brief Gated</span>
                        <a href="#/login" class="btn btn-outline btn-sm">View & Apply &rarr;</a>
                    </div>
                </div>
            `).join("");
        } catch (err) {
            grid.innerHTML = `<div class="card" style="color: var(--accent-coral);">Error loading problems: ${escapeHtml(err.message)}</div>`;
        }
    }

    document.getElementById("btn-apply-filter")?.addEventListener("click", loadProjects);
    document.getElementById("filter-skill")?.addEventListener("keyup", (e) => { if (e.key === "Enter") loadProjects(); });
    await loadProjects();
}

/** 4. Role Landing Pages (Students, Experts, Companies) */
function renderStudentsPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">STUDENT EMPOWERMENT</span>
            <h1>Work you can prove. Pay you can count on.</h1>
            <p>Tired of uncredited take-home challenges? VOUCH locks your payment in escrow before you begin.</p>
        </div>
        <div class="grid-3">
            <div class="card">
                <h3>⭐ Newbie Boost</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">No stars yet? No problem. The Newbie badge highlights verified skills and provides an automatic +5% exploration score boost.</p>
            </div>
            <div class="card">
                <h3>💰 Guaranteed Rupee Split</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">Every milestone payout is pre-allocated: 40% equal floor across team members plus 60% based on reviewed contributions.</p>
            </div>
            <div class="card">
                <h3>📜 Cryptographic Proof</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">Your accepted pull requests, milestone completions, and peer reviews are permanently verifiable on the SHA-256 diary.</p>
            </div>
        </div>
        <div style="text-align: center; margin-top: 40px;">
            <a href="#/open-problems" class="btn btn-primary btn-lg">Browse Open Problems</a>
        </div>
    `;
}

function renderExpertsPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-coral">EXPERT ADVISORY</span>
            <h1>Mentorship with Boundaries & Attribution</h1>
            <p>Guide aspiring engineering teams without uncompensated administrative sprawl.</p>
        </div>
        <div class="grid-3">
            <div class="card">
                <h3>🔍 Review Queue</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">Comment on tasks, audit code submissions, verify automated similarity checks, and sign off on milestone completions.</p>
            </div>
            <div class="card">
                <h3>💼 Clear 30% Pool Split</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">Experts earn a guaranteed 30% advisory share from net milestone pools with transparent integer rupee receipts.</p>
            </div>
            <div class="card">
                <h3>⚖️ Conflict of Interest Protection</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">Declare industry relationships transparently. The matchmaking engine automatically excludes conflicting projects.</p>
            </div>
        </div>
        <div style="text-align: center; margin-top: 40px;">
            <a href="#/login" class="btn btn-secondary btn-lg">Log in as Expert</a>
        </div>
    `;
}

function renderCompaniesPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-accent">ENTERPRISE & LABS</span>
            <h1>De-Risk High-Velocity Innovation</h1>
            <p>Engage elite student talent guided by senior experts with bulletproof IP and escrow safety.</p>
        </div>
        <div class="grid-3">
            <div class="card">
                <h3>🔐 Gated Confidential Briefs</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">Your proprietary datasets and briefs are never exposed to candidates until they formally sign the versioned charter agreement.</p>
            </div>
            <div class="card">
                <h3>📊 Pros & Cons Matchmaking</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">Rank candidates based on proven closed project track records, objective timeliness, and peer review data.</p>
            </div>
            <div class="card">
                <h3>🤝 Clear Commercialization Clauses</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">Standardized charters protect enterprise commercial licensing while honoring academic co-authorship.</p>
            </div>
        </div>
        <div style="text-align: center; margin-top: 40px;">
            <a href="#/login" class="btn btn-primary btn-lg">Post a Problem</a>
        </div>
    `;
}

/** 5. Informational Pages (About, FAQ, Contact, Pricing, Terms, Privacy, Help) */
function renderAboutPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">ABOUT VOUCH</span>
            <h1>Trust Through Provable Mathematics</h1>
            <p>Why we built a platform that never relies on self-reported claims or opaque algorithms.</p>
        </div>
        <div class="card" style="max-width: 800px; margin: 0 auto;">
            <p style="margin-bottom: 16px;">
                VOUCH was conceived around a single uncompromising standard: <strong>every claim must be verifiable on an append-only cryptographic ledger</strong>.
            </p>
            <p style="margin-bottom: 16px;">
                In the era of AI-generated resumes and boilerplate portfolios, traditional hiring and freelance platforms have deteriorated into a race to the bottom. VOUCH restores accountability by tying real milestone money into escrow lockers and computing reputations strictly from closed projects with reciprocal structured reviews.
            </p>
            <p style="margin-bottom: 16px;">
                <strong>Key Guarantees:</strong>
            </p>
            <ul style="padding-left: 24px; color: var(--text-muted); margin-bottom: 20px;">
                <li><strong>No Real Money Risk:</strong> Fully synthetic demonstration platform operating locally with zero payment gateway lock-in.</li>
                <li><strong>Deterministic Logic:</strong> The matchmaking, star rating adjustments, and payout split calculations do not depend on external LLM calls.</li>
                <li><strong>Tamper Evident:</strong> Built-in SHA-256 hash chaining immediately flags unauthorized database alterations.</li>
            </ul>
        </div>
    `;
}

function renderFAQPage(container) {
    renderHomePage(container);
    window.location.hash = "#faq-accordion";
}

function renderContactPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">GET IN TOUCH</span>
            <h1>Contact VOUCH</h1>
            <p>All inquiries are recorded on the cryptographic ledger in demo mode.</p>
        </div>
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <form id="contact-form">
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" id="c-name" required placeholder="Alex Mercer">
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-input" id="c-email" required placeholder="alex@domain.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Subject</label>
                    <input type="text" class="form-input" id="c-subject" required placeholder="Question about charter agreements">
                </div>
                <div class="form-group">
                    <label class="form-label">Message</label>
                    <textarea class="form-textarea" id="c-message" rows="4" required placeholder="Enter your inquiry here..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Message</button>
            </form>
        </div>
    `;

    document.getElementById("contact-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            await api("/api/contact", {
                method: "POST",
                body: {
                    name: document.getElementById("c-name").value,
                    email: document.getElementById("c-email").value,
                    subject: document.getElementById("c-subject").value,
                    message: document.getElementById("c-message").value,
                }
            });
            showToast("Message recorded on the VOUCH ledger!", "success");
            e.target.reset();
        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

function renderPricingPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">TRANSPARENT ECONOMICS</span>
            <h1>Pricing & Integer Rupee Split Math</h1>
            <p>Every rupee accounted for with zero hidden deductions.</p>
        </div>
        <div class="card" style="max-width: 800px; margin: 0 auto 32px;">
            <h3>Standard Milestone Split (On Rs 1,00,000 Milestone)</h3>
            <div style="margin: 20px 0; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-subtle); color: var(--text-muted);">
                            <th style="padding: 10px;">Recipient</th>
                            <th style="padding: 10px;">Calculation Formula</th>
                            <th style="padding: 10px;">Percentage</th>
                            <th style="padding: 10px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid var(--border-subtle);">
                            <td style="padding: 12px 10px;"><strong>Platform Fee</strong></td>
                            <td style="padding: 12px 10px;">10% of milestone amount</td>
                            <td style="padding: 12px 10px;">10.0%</td>
                            <td style="padding: 12px 10px; font-weight: 700;">Rs 10,000</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-subtle);">
                            <td style="padding: 12px 10px;"><strong>AI Compute Reserve</strong></td>
                            <td style="padding: 12px 10px;">5% of milestone amount</td>
                            <td style="padding: 12px 10px;">5.0%</td>
                            <td style="padding: 12px 10px; font-weight: 700;">Rs 5,000</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-subtle);">
                            <td style="padding: 12px 10px;"><strong>Expert Advisor</strong></td>
                            <td style="padding: 12px 10px;">30% of net pool (Rs 85,000)</td>
                            <td style="padding: 12px 10px;">25.5%</td>
                            <td style="padding: 12px 10px; font-weight: 700; color: var(--primary-teal);">Rs 25,500</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border-subtle);">
                            <td style="padding: 12px 10px;"><strong>Student Pool</strong></td>
                            <td style="padding: 12px 10px;">70% of net pool (40% equal + 60% weighted)</td>
                            <td style="padding: 12px 10px;">59.5%</td>
                            <td style="padding: 12px 10px; font-weight: 700; color: var(--primary-teal);">Rs 59,500</td>
                        </tr>
                        <tr style="background: var(--bg-surface); font-weight: 800;">
                            <td style="padding: 12px 10px;" colspan="3">Total Distributed</td>
                            <td style="padding: 12px 10px;">Rs 1,00,000</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style="background: var(--bg-surface); padding: 16px; border-radius: var(--radius-sm); font-size: 0.9rem;">
                <strong>Exact Integer Rupee Guarantee:</strong> For 3 students with contribution weights (0.5, 0.3, 0.2), payouts evaluate exactly to <strong>Rs 25,783</strong>, <strong>Rs 18,643</strong>, and <strong>Rs 15,074</strong> (absorbing 1 rupee rounding remainder) ensuring conservation of every single rupee.
            </div>
        </div>
    `;
}

function renderTermsPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-accent">LEGAL & CHARTER</span>
            <h1>Charter Agreement & Platform Terms</h1>
            <p>Binding digital terms for escrow security, intellectual property, and exit rules.</p>
        </div>
        <div class="card" style="max-width: 800px; margin: 0 auto;">
            <h4>1. Escrow Lock & Commitment</h4>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px; margin-bottom: 16px;">
                No funded milestone may commence work before the project locker has received confirmed funding. Funds are released exclusively upon milestone acceptance.
            </p>
            <h4>2. Intellectual Property & Attribution</h4>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px; margin-bottom: 16px;">
                Commercial licensing rights transfer to the company sponsor only after verified milestone release. Students and experts maintain irrevocable moral attribution and co-authorship credit.
            </p>
            <h4>3. Exit Terms & Compensation</h4>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 6px;">
                Candidates who quit prematurely forfeit unearned allocations and incur a -0.5 star penalty. Sponsors who withdraw prematurely forfeit all remaining escrow to the team plus a mandatory 10% penalty compensation fee.
            </p>
        </div>
    `;
}

function renderPrivacyPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">DATA PRIVACY</span>
            <h1>Privacy & Confidentiality</h1>
            <p>Zero external trackers, local deterministic execution, and cryptographic sandboxing.</p>
        </div>
        <div class="card" style="max-width: 800px; margin: 0 auto;">
            <p style="margin-bottom: 12px;">VOUCH respects confidentiality by design:</p>
            <ul style="padding-left: 24px; color: var(--text-muted); line-height: 1.8;">
                <li>Confidential datasets are never accessible to unaccepted members or web scrapers.</li>
                <li>Zero third-party trackers, external advertising scripts, or cookies beyond secure httpOnly session cookies.</li>
                <li>All demo data is synthetic and resides strictly within the local SQLite database.</li>
            </ul>
        </div>
    `;
}

function renderHelpPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">HELP CENTER</span>
            <h1>Help & Demonstration Guide</h1>
            <p>How to test and navigate every phase of the platform.</p>
        </div>
        <div class="grid-2">
            <div class="card">
                <h3>Quick Demo Navigation</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">
                    Use the <strong>Quick Demo Login</strong> buttons on the login screen to switch between Sponsor, Experts, Students, and the Admin persona without manual password typing.
                </p>
            </div>
            <div class="card">
                <h3>Testing Ledger Tampering</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">
                    Log in as <strong>System Admin</strong>, visit the Admin Dashboard, and click "Simulate Tamper". Then return to the homepage or run verify to see the red tamper alert trigger.
                </p>
            </div>
        </div>
    `;
}

/** 6. Auth Pages (Login, Signup, Forgot, Reset) */
function renderLoginPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">DEMO PORTAL</span>
            <h1>Log In to VOUCH</h1>
            <p>Access your workspace, review queue, or administrative dashboard.</p>
        </div>

        <div style="max-width: 540px; margin: 0 auto;">
            <!-- Quick Demo Login Row (SPEC.md Section 14) -->
            <div class="quick-login-box">
                <h4>⚡ One-Click Quick Demo Login</h4>
                <div class="quick-login-buttons">
                    <button class="btn btn-outline btn-sm quick-acc" data-email="sponsor@vouch.local">Sponsor (Apex)</button>
                    <button class="btn btn-outline btn-sm quick-acc" data-email="expert.a@vouch.local">Expert A (4.9 ⭐)</button>
                    <button class="btn btn-outline btn-sm quick-acc" data-email="expert.b@vouch.local">Expert B (Conflict)</button>
                    <button class="btn btn-outline btn-sm quick-acc" data-email="student.a@vouch.local">Student A (4.6 ⭐)</button>
                    <button class="btn btn-outline btn-sm quick-acc" data-email="student.b@vouch.local">Student B (3.9 ⭐)</button>
                    <button class="btn btn-outline btn-sm quick-acc" data-email="student.c@vouch.local">Student C (Newbie)</button>
                    <button class="btn btn-outline btn-sm quick-acc" data-email="admin@vouch.local">Admin</button>
                </div>
            </div>

            <div class="card">
                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-input" id="login-email" required placeholder="name@vouch.local">
                    </div>
                    <div class="form-group">
                        <div style="display: flex; justify-content: space-between;">
                            <label class="form-label">Password</label>
                            <a href="#/forgot-password" style="font-size: 0.8rem; color: var(--primary-teal);">Forgot password?</a>
                        </div>
                        <input type="password" class="form-input" id="login-pwd" required value="Password123!">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Log In</button>
                </form>
                <div style="text-align: center; margin-top: 16px; font-size: 0.85rem; color: var(--text-muted);">
                    Don't have an account yet? <a href="#/signup" style="color: var(--primary-teal); font-weight: 600;">Sign up here</a>
                </div>
            </div>
        </div>
    `;

    // Quick Login clicks
    document.querySelectorAll(".quick-acc").forEach(btn => {
        btn.addEventListener("click", () => {
            const email = btn.getAttribute("data-email");
            document.getElementById("login-email").value = email;
            document.getElementById("login-pwd").value = "Password123!";
            document.getElementById("login-form").requestSubmit();
        });
    });

    document.getElementById("login-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const res = await api("/api/auth/login", {
                method: "POST",
                body: {
                    email: document.getElementById("login-email").value,
                    password: document.getElementById("login-pwd").value,
                }
            });
            state.user = res.user;
            showToast(`Welcome back, ${res.user.name}!`, "success");
            navigate("#/dashboard");
        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

function renderSignupPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">JOIN THE NETWORK</span>
            <h1>Create an Account</h1>
            <p>Every account is assigned verified skills or stars backed by receipts.</p>
        </div>
        <div class="card" style="max-width: 540px; margin: 0 auto;">
            <form id="signup-form">
                <div class="form-group">
                    <label class="form-label">Select Your Role</label>
                    <select class="form-select" id="su-role" required>
                        <option value="student">Student / Contributor (Starts with Newbie Badge)</option>
                        <option value="expert">Expert Mentor (Guiding role)</option>
                        <option value="sponsor">Company Sponsor (Posting initiatives)</option>
                        <option value="admin">Platform Admin (Audit & Governance)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" id="su-name" required placeholder="Maya Lin">
                </div>
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" class="form-input" id="su-email" required placeholder="maya@university.edu">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" id="su-pwd" required placeholder="Minimum 8 characters">
                </div>
                <div class="form-group">
                    <label class="form-label">Headline / Specialty</label>
                    <input type="text" class="form-input" id="su-headline" placeholder="e.g. MS CS specializing in Computer Vision">
                </div>
                <div class="form-group">
                    <label class="form-label">Core Skills (comma separated)</label>
                    <input type="text" class="form-input" id="su-skills" placeholder="Python, PyTorch, Embedded Systems">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Sign Up</button>
            </form>
            <div style="text-align: center; margin-top: 16px; font-size: 0.85rem; color: var(--text-muted);">
                Already have an account? <a href="#/login" style="color: var(--primary-teal); font-weight: 600;">Log in</a>
            </div>
        </div>
    `;

    document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const skills = document.getElementById("su-skills").value.split(",").map(s => s.trim()).filter(Boolean);
        try {
            const res = await api("/api/auth/signup", {
                method: "POST",
                body: {
                    role: document.getElementById("su-role").value,
                    name: document.getElementById("su-name").value,
                    email: document.getElementById("su-email").value,
                    password: document.getElementById("su-pwd").value,
                    headline: document.getElementById("su-headline").value,
                    skills: skills,
                }
            });
            state.user = res.user;
            showToast("Account created successfully!", "success");
            navigate("#/dashboard");
        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

function renderForgotPasswordPage(container) {
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">DEMO PASSWORD RESET</span>
            <h1>Forgot Password</h1>
            <p>In demo mode, your reset token is displayed right on screen.</p>
        </div>
        <div class="card" style="max-width: 500px; margin: 0 auto;">
            <form id="forgot-form">
                <div class="form-group">
                    <label class="form-label">Account Email Address</label>
                    <input type="email" class="form-input" id="f-email" required placeholder="student.a@vouch.local" value="student.a@vouch.local">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Generate Reset Token</button>
            </form>

            <div id="reset-token-display" style="display: none; margin-top: 24px; padding: 16px; background: var(--bg-surface); border: 1px dashed var(--primary-teal); border-radius: var(--radius-sm);">
                <div style="font-weight: 700; color: var(--primary-teal); margin-bottom: 8px;">Demo Reset Token Generated:</div>
                <div style="font-family: var(--font-mono); font-size: 1.1rem; background: white; padding: 8px 12px; border-radius: 4px; border: 1px solid var(--border-medium); margin-bottom: 12px;" id="token-val"></div>
                <button class="btn btn-secondary btn-sm" id="btn-use-token" style="width: 100%;">Use Token to Reset Password &rarr;</button>
            </div>
        </div>
    `;

    document.getElementById("forgot-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const res = await api("/api/auth/forgot-password", {
                method: "POST",
                body: { email: document.getElementById("f-email").value }
            });
            const display = document.getElementById("reset-token-display");
            display.style.display = "block";
            document.getElementById("token-val").textContent = res.demo_reset_token;
            document.getElementById("btn-use-token").onclick = () => {
                sessionStorage.setItem("vouch_reset_token", res.demo_reset_token);
                navigate("#/reset-password");
            };
            showToast("Demo token generated on screen!", "success");
        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

function renderResetPasswordPage(container) {
    const savedToken = sessionStorage.getItem("vouch_reset_token") || "";
    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">SECURITY UPDATE</span>
            <h1>Reset Your Password</h1>
            <p>Enter your reset token to set a new password.</p>
        </div>
        <div class="card" style="max-width: 500px; margin: 0 auto;">
            <form id="reset-form">
                <div class="form-group">
                    <label class="form-label">Reset Token</label>
                    <input type="text" class="form-input" id="r-token" required value="${savedToken}">
                </div>
                <div class="form-group">
                    <label class="form-label">New Password</label>
                    <input type="password" class="form-input" id="r-pwd" required placeholder="Minimum 8 characters">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Save New Password</button>
            </form>
        </div>
    `;

    document.getElementById("reset-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            await api("/api/auth/reset-password", {
                method: "POST",
                body: {
                    token: document.getElementById("r-token").value,
                    new_password: document.getElementById("r-pwd").value,
                }
            });
            sessionStorage.removeItem("vouch_reset_token");
            showToast("Password updated successfully! You can now log in.", "success");
            navigate("#/login");
        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

/** 7. Settings Page (SPEC.md Section 4) */
async function renderSettingsPage(container) {
    if (!state.user) {
        navigate("#/login");
        return;
    }

    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">ACCOUNT CONFIGURATION</span>
            <h1>Profile & Notification Settings</h1>
            <p>Manage your public persona, weekly availability, and notification preferences.</p>
        </div>
        <div style="max-width: 720px; margin: 0 auto;">
            <div class="card" style="margin-bottom: 24px;">
                <h3>Personal Profile</h3>
                <form id="settings-profile-form" style="margin-top: 16px;">
                    <div class="form-group">
                        <label class="form-label">Display Name</label>
                        <input type="text" class="form-input" id="set-name" value="${escapeHtml(state.user.name)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Headline / Specialty</label>
                        <input type="text" class="form-input" id="set-headline" value="${escapeHtml(state.user.headline || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Weekly Hours Available</label>
                        <input type="number" class="form-input" id="set-hours" value="20" min="5" max="60">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Core Skills (comma separated)</label>
                        <input type="text" class="form-input" id="set-skills" value="${(state.user.skills || []).join(', ')}">
                    </div>
                    <button type="submit" class="btn btn-primary">Save Profile Changes</button>
                </form>
            </div>

            <div class="card" style="margin-bottom: 24px;">
                <h3>Change Password</h3>
                <form id="change-pwd-form" style="margin-top: 16px;">
                    <div class="form-group">
                        <label class="form-label">Current Password</label>
                        <input type="password" class="form-input" id="cp-old" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" class="form-input" id="cp-new" required>
                    </div>
                    <button type="submit" class="btn btn-secondary">Update Password</button>
                </form>
            </div>

            <div class="card" style="border-color: #fecdd3;">
                <h3 style="color: var(--accent-coral);">Account Deletion Request</h3>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 8px; margin-bottom: 16px;">
                    In accordance with simulated KYC retention policies, account deletion schedules historical review records for archival on the immutable ledger.
                </p>
                <button class="btn btn-accent btn-sm" id="btn-delete-req">Request Account Deletion (Simulated)</button>
            </div>
        </div>
    `;

    document.getElementById("settings-profile-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const skills = document.getElementById("set-skills").value.split(",").map(s => s.trim()).filter(Boolean);
        try {
            await api("/api/user/settings", {
                method: "PUT",
                body: {
                    name: document.getElementById("set-name").value,
                    headline: document.getElementById("set-headline").value,
                    weekly_hours: parseInt(document.getElementById("set-hours").value, 10),
                    skills: skills,
                }
            });
            await checkAuth();
            showToast("Settings updated successfully.", "success");
        } catch (err) {
            showToast(err.message, "error");
        }
    });

    document.getElementById("change-pwd-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            await api("/api/user/change-password", {
                method: "POST",
                body: {
                    old_password: document.getElementById("cp-old").value,
                    new_password: document.getElementById("cp-new").value,
                }
            });
            showToast("Password changed successfully!", "success");
            e.target.reset();
        } catch (err) {
            showToast(err.message, "error");
        }
    });

    document.getElementById("btn-delete-req")?.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to request simulated account deletion?")) return;
        try {
            const res = await api("/api/user/delete-request", { method: "POST" });
            showToast(res.message, "success");
        } catch (err) {
            showToast(err.message, "error");
        }
    });
}

/** 8. Notifications Page (SPEC.md Section 4) */
async function renderNotificationsPage(container) {
    if (!state.user) {
        navigate("#/login");
        return;
    }

    container.innerHTML = `
        <div class="section-header">
            <span class="badge badge-teal">ACTIVITY INBOX</span>
            <h1>Notifications</h1>
            <p>Milestone releases, charter updates, and integrity alerts.</p>
        </div>
        <div class="card" style="max-width: 800px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Recent Alerts (${state.unreadCount} unread)</h3>
                <button class="btn btn-outline btn-sm" id="page-mark-read">Mark All as Read</button>
            </div>
            <div id="notif-full-list">
                ${state.notifications.length === 0 ? `<p style="color: var(--text-muted);">No notifications in your inbox.</p>` : 
                  state.notifications.map(n => `
                    <div class="notif-item ${n.read ? '' : 'unread'}" style="margin-bottom: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                        <div class="notif-title">${escapeHtml(n.title)}</div>
                        <div style="font-size: 0.9rem; color: var(--text-muted);">${escapeHtml(n.message)}</div>
                        <div class="notif-time">${new Date(n.created_at).toLocaleString()}</div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    document.getElementById("page-mark-read")?.addEventListener("click", async () => {
        await api("/api/notifications/read-all", { method: "POST" });
        await fetchNotifications();
        renderNotificationsPage(container);
        showToast("All notifications marked as read.", "success");
    });
}

/** 9. Public Profile Page (SPEC.md Section 4) */
async function renderPublicProfilePage(container, userId) {
    container.innerHTML = `<div class="skeleton-card"></div>`;
    try {
        const u = await api(`/api/users/${encodeURIComponent(userId)}/public`);
        container.innerHTML = `
            <div class="card" style="max-width: 850px; margin: 0 auto 32px;">
                <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                    <div style="width: 72px; height: 72px; border-radius: var(--radius-full); background: var(--primary-teal); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800;">
                        ${escapeHtml(u.avatar_initials)}
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <h2 style="font-size: 1.8rem;">${escapeHtml(u.name)}</h2>
                            <span class="badge ${u.newbie_badge ? 'badge-newbie' : 'badge-gold'}">
                                ${u.newbie_badge ? 'NEWBIE BADGE' : `${u.stars || '4.5'} ⭐`}
                            </span>
                            <span class="badge badge-accent">${escapeHtml(u.role).toUpperCase()}</span>
                        </div>
                        <p style="color: var(--text-muted); font-size: 1.05rem; margin-top: 4px;">${escapeHtml(u.headline)}</p>
                    </div>
                </div>

                <!-- Verified Skills -->
                <div style="margin-top: 24px;">
                    <h4>Verified Skills</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                        ${(u.skills || []).map(s => `<span class="badge badge-teal">${escapeHtml(s)}</span>`).join("")}
                    </div>
                </div>

                <!-- Pros and Cons Panel (SPEC.md Section 7) -->
                <div style="margin-top: 32px;">
                    <h4>Track Record Insights (From Closed Projects)</h4>
                    ${u.newbie_badge ? `
                        <div style="background: var(--bg-surface); padding: 16px; border-radius: var(--radius-sm); margin-top: 8px; color: var(--text-muted);">
                            ℹ No closed project history yet. Verified skills displayed with exploratory matching boost.
                        </div>
                    ` : `
                        <div class="pros-cons-grid">
                            <div class="pro-card">
                                <div class="pro-title">✔ Strengths (Pros)</div>
                                <ul style="padding-left: 20px; font-size: 0.85rem; color: #15803d;">
                                    ${(u.pros || []).map(p => `<li>${escapeHtml(p)}</li>`).join("") || '<li>Consistent delivery record</li>'}
                                </ul>
                            </div>
                            <div class="con-card">
                                <div class="con-title">⚠ Watch-outs (Cons)</div>
                                <ul style="padding-left: 20px; font-size: 0.85rem; color: #b91c1c;">
                                    ${(u.cons || []).map(c => `<li>${escapeHtml(c)}</li>`).join("") || '<li>No negative flags on record</li>'}
                                </ul>
                            </div>
                        </div>
                    `}
                </div>

                <!-- Company Record if Sponsor (SPEC.md Section 6) -->
                ${u.company_record ? `
                    <div style="margin-top: 32px; background: var(--bg-surface); padding: 20px; border-radius: var(--radius-sm);">
                        <h4>Sponsor Record & Reliability</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-top: 12px;">
                            <div><strong>On-Time Payment:</strong> ${u.company_record.on_time_payment_rate}</div>
                            <div><strong>Dispute Count:</strong> ${u.company_record.dispute_count}</div>
                            <div><strong>Withdrawals:</strong> ${u.company_record.withdrawals}</div>
                            <div><strong>Benefit Score:</strong> ${u.company_record.past_contributor_benefit_score}</div>
                        </div>
                    </div>
                ` : ""}

                <!-- Closed Projects List -->
                <div style="margin-top: 32px;">
                    <h4>Closed Projects & Outcomes</h4>
                    ${(u.closed_projects || []).length === 0 ? `<p style="color: var(--text-muted); margin-top: 8px;">No closed projects on record.</p>` :
                      u.closed_projects.map(p => `
                        <div style="background: var(--bg-surface); padding: 12px 16px; border-radius: var(--radius-sm); margin-top: 8px;">
                            <strong>${escapeHtml(p.title)}</strong> &mdash; <span style="color: var(--primary-teal);">${formatRupees(p.budget)}</span>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${escapeHtml(p.public_summary)}</p>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="card" style="color: var(--accent-coral);">Failed to load profile: ${escapeHtml(err.message)}</div>`;
    }
}

/** 10. Navigable Role Dashboards (SPEC.md Section 5) */
function renderDashboardPage(container) {
    if (!state.user) {
        navigate("#/login");
        return;
    }

    const role = state.user.role;

    container.innerHTML = `
        <div class="dashboard-layout">
            <!-- Sidebar -->
            <aside class="dashboard-sidebar">
                <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 16px;">
                    <div class="user-avatar-sm" style="width: 48px; height: 48px; margin: 0 auto 8px; font-size: 1.2rem;">
                        ${escapeHtml(state.user.avatar_initials || state.user.name.substring(0, 2).toUpperCase())}
                    </div>
                    <strong>${escapeHtml(state.user.name)}</strong>
                    <div style="font-size: 0.75rem; color: var(--primary-teal); text-transform: uppercase; font-weight: 700;">${escapeHtml(state.user.role)} DASHBOARD</div>
                </div>

                <ul class="dashboard-nav-list">
                    <li class="dashboard-nav-item active"><a href="#/dashboard">📊 Overview</a></li>
                    <li class="dashboard-nav-item"><a href="#/open-problems">🔍 Open Problems</a></li>
                    <li class="dashboard-nav-item"><a href="#/notifications">🔔 Alerts (${state.unreadCount})</a></li>
                    <li class="dashboard-nav-item"><a href="#/profile/${state.user.id}">👤 My Public Profile</a></li>
                    <li class="dashboard-nav-item"><a href="#/settings">⚙️ Settings</a></li>
                </ul>
            </aside>

            <!-- Main Dashboard Area -->
            <section class="dashboard-main">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2>Welcome back, ${escapeHtml(state.user.name.split(" ")[0])}</h2>
                        <p style="color: var(--text-muted); font-size: 0.95rem;">Here is your live platform status and required actions.</p>
                    </div>
                    <span class="badge ${state.user.newbie_badge ? 'badge-newbie' : 'badge-gold'}">
                        ${state.user.newbie_badge ? 'NEWBIE BADGE' : `${state.user.stars || 4.5} ⭐ RATING`}
                    </span>
                </div>

                <!-- Role Specific Stat Cards -->
                ${renderRoleStats(role)}

                <!-- Needs My Action Card -->
                <div class="card" style="margin-top: 24px;">
                    <h3>⚡ Needs My Action</h3>
                    <div id="action-items-list" style="margin-top: 12px;">
                        ${renderActionItems(role)}
                    </div>
                </div>

                <!-- Live Activity Feed Read from Ledger -->
                <div class="card" style="margin-top: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3>📜 Live Activity Stream (From Ledger)</h3>
                        <span class="badge badge-teal">SHA-256 AUDITED</span>
                    </div>
                    <div id="dashboard-ledger-feed">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                    </div>
                </div>
            </section>
        </div>
    `;

    loadLedgerFeed();
}

function renderRoleStats(role) {
    if (role === "student") {
        return `
            <div class="grid-3">
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Paid Earnings</div>
                    <h3 style="color: var(--primary-teal); font-size: 1.8rem; margin: 4px 0;">Rs 25,783</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">From closed project milestones</p>
                </div>
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Locked in Escrow</div>
                    <h3 style="color: #0284c7; font-size: 1.8rem; margin: 4px 0;">Rs 59,500</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">In Diabetic Retinopathy initiative</p>
                </div>
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Simulated Wallet</div>
                    <h3 style="color: var(--text-main); font-size: 1.8rem; margin: 4px 0;">${formatRupees(state.user.wallet_balance || 25000)}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Available for simulated transfers</p>
                </div>
            </div>
        `;
    } else if (role === "expert") {
        return `
            <div class="grid-3">
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Guiding Initiatives</div>
                    <h3 style="color: var(--primary-teal); font-size: 1.8rem; margin: 4px 0;">1 Active</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Edge Diabetic Retinopathy</p>
                </div>
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Review Queue</div>
                    <h3 style="color: #d97706; font-size: 1.8rem; margin: 4px 0;">1 Pending</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Submissions ready for signoff</p>
                </div>
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Declared Conflicts</div>
                    <h3 style="color: var(--accent-coral); font-size: 1.8rem; margin: 4px 0;">0 Blocking</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Conflict checks active</p>
                </div>
            </div>
        `;
    } else if (role === "sponsor") {
        return `
            <div class="grid-3">
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Sponsor Wallet</div>
                    <h3 style="color: var(--primary-teal); font-size: 1.8rem; margin: 4px 0;">${formatRupees(state.user.wallet_balance || 500000)}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Simulated balance for escrows</p>
                </div>
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Committed to Escrow</div>
                    <h3 style="color: #0284c7; font-size: 1.8rem; margin: 4px 0;">Rs 1,00,000</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Locked in Retinopathy Locker</p>
                </div>
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Active Projects</div>
                    <h3 style="color: var(--text-main); font-size: 1.8rem; margin: 4px 0;">2 Initiatives</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">1 Funded, 1 Knowledge Sharing</p>
                </div>
            </div>
        `;
    } else { // Admin
        return `
            <div class="grid-3">
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Ledger Status</div>
                    <h3 style="color: var(--primary-teal); font-size: 1.8rem; margin: 4px 0;">VERIFIED OK</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Zero hash breaks detected</p>
                </div>
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Flagged Submissions</div>
                    <h3 style="color: var(--text-main); font-size: 1.8rem; margin: 4px 0;">0 Disputes</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Similarity check queue clear</p>
                </div>
                <div class="card">
                    <div style="font-size: 0.8rem; color: var(--text-subtle); text-transform: uppercase;">Admin Tools</div>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button class="btn btn-accent btn-sm" id="btn-admin-tamper">Simulate Tamper</button>
                        <button class="btn btn-secondary btn-sm" id="btn-admin-reset">Reset Demo Data</button>
                    </div>
                </div>
            </div>
        `;
    }
}

function renderActionItems(role) {
    if (role === "student") {
        return `
            <div style="padding: 12px; background: #f0fdfa; border: 1px solid var(--primary-teal-border); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Accept Charter v1: Diabetic Retinopathy</strong>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">Accept the published charter and engagement model to unlock confidential datasets.</p>
                </div>
                <a href="#/open-problems" class="btn btn-primary btn-sm">Review & Accept</a>
            </div>
        `;
    } else if (role === "expert") {
        return `
            <div style="padding: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Review Milestone 1 Scoping: Diabetic Retinopathy</strong>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">Ensure preprocessing benchmark requirements match hardware limitations.</p>
                </div>
                <a href="#/open-problems" class="btn btn-outline btn-sm">Inspect Milestone</a>
            </div>
        `;
    } else if (role === "sponsor") {
        return `
            <div style="padding: 12px; background: #f8fafc; border: 1px solid var(--border-medium); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Review Matchmaking Queue for Diabetic Retinopathy</strong>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">Inspect top-ranked student and expert applicants with pros & cons.</p>
                </div>
                <a href="#/open-problems" class="btn btn-primary btn-sm">View Matches</a>
            </div>
        `;
    } else {
        return `<p style="color: var(--text-muted);">All audit tasks up to date. Zero pending disputes.</p>`;
    }
}

async function loadLedgerFeed() {
    const feed = document.getElementById("dashboard-ledger-feed");
    if (!feed) return;
    try {
        const res = await api("/api/ledger?limit=6");
        if (!res.entries || res.entries.length === 0) {
            feed.innerHTML = `<p style="color: var(--text-muted);">No ledger entries recorded yet.</p>`;
            return;
        }
        feed.innerHTML = res.entries.map(e => `
            <div style="padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; font-size: 0.85rem; align-items: center;">
                <div>
                    <span class="badge badge-accent" style="margin-right: 8px;">#${e.seq}</span>
                    <strong>${escapeHtml(e.action)}</strong> by <span style="color: var(--text-subtle);">${escapeHtml(e.actor)}</span>
                </div>
                <div style="font-family: var(--font-mono); color: var(--text-subtle); font-size: 0.75rem;">
                    ${e.entry_hash.substring(0, 12)}...
                </div>
            </div>
        `).join("");

        // Bind admin tamper / reset if present
        document.getElementById("btn-admin-tamper")?.addEventListener("click", async () => {
            await api("/api/ledger/simulate-tamper", { method: "POST" });
            showToast("Simulated database tamper applied to block #2!", "error");
            loadLedgerFeed();
        });
        document.getElementById("btn-admin-reset")?.addEventListener("click", async () => {
            await api("/api/admin/reset", { method: "POST" });
            showToast("Demo database and ledger reset to initial clean state.", "success");
            loadLedgerFeed();
        });
    } catch (err) {
        feed.innerHTML = `<p style="color: var(--accent-coral);">Failed to load ledger stream: ${escapeHtml(err.message)}</p>`;
    }
}

/** 11. Custom 404 Page (SPEC.md Section 3) */
function render404Page(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center; padding: 48px;">
            <div style="font-size: 3.5rem; margin-bottom: 12px;">🛡️ 404</div>
            <h2 style="margin-bottom: 12px;">Page Not Found</h2>
            <p style="color: var(--text-muted); margin-bottom: 24px;">
                The requested URL route does not exist or has been relocated.
            </p>
            <a href="#/" class="btn btn-primary">Return to Home</a>
        </div>
    `;
}
