/* ═══════════════════════════════════════════════
   Auth — Demo User Session Manager
   VangVieng Explorer v3
═══════════════════════════════════════════════ */

const DEMO_USERS = [
  { username: "demo",       password: "vangvieng2024", name: "Demo User",     role: "demo",  limit: 10 },
  { username: "demo_press", password: "press2024",     name: "Press / Media", role: "press", limit: 30 },
  { username: "admin",      password: "vve@admin2024", name: "Admin",         role: "admin", limit: 999 },
];

const SESSION_KEY  = "vve_session";
const RATE_KEY_PFX = "vve_rate_";

// ── Current session ──
const Auth = {

  // ── Login ──
  login(username, password) {
    const user = DEMO_USERS.find(
      u => u.username === username.trim().toLowerCase() &&
           u.password  === password
    );
    if (!user) return { ok: false, msg: "ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ" };

    const session = {
      username: user.username,
      name:     user.name,
      role:     user.role,
      limit:    user.limit,
      loginAt:  Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  },

  // ── Logout ──
  logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = this._loginPath();
  },

  // ── Get current session (null if not logged in) ──
  getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  // ── Is logged in? ──
  isLoggedIn() {
    return !!this.getSession();
  },

  // ── Require login — redirect if not ──
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = this._loginPath() + "?next=" + encodeURIComponent(window.location.href);
    }
  },

  // ── Inject user badge into navbar ──
  injectBadge() {
    const session = this.getSession();
    if (!session) return;

    // Remove existing badge
    document.getElementById("authBadge")?.remove();

    const badge = document.createElement("div");
    badge.id = "authBadge";
    badge.style.cssText = `
      display:flex; align-items:center; gap:8px;
      font-size:0.78rem; font-weight:600;
      color: var(--dark, #071830);
      cursor:pointer;
    `;

    const roleEmoji = { admin: "🔑", press: "🎤", demo: "👤" }[session.role] || "👤";
    const remaining = RateLimit.remaining(session.username, session.limit);
    const limitBadge = session.role === "admin" ? "" :
      `<span style="background:${remaining <= 2 ? '#ffdede' : '#e0f2ff'};
        color:${remaining <= 2 ? '#c0392b' : '#1050a0'};
        padding:1px 7px; border-radius:99px; font-size:0.72rem; font-weight:700;">
        AI ${remaining}/${session.limit}
      </span>`;

    badge.innerHTML = `
      ${roleEmoji} ${session.name}
      ${limitBadge}
      <button onclick="Auth.logout()" style="
        background:none; border:1px solid #ccd;
        padding:2px 9px; border-radius:99px;
        font-size:0.7rem; cursor:pointer; color:inherit;
        font-family:inherit;
      ">ອອກ</button>
    `;

    // Insert into navbar container
    const navContainer = document.querySelector(".nav-container");
    if (navContainer) navContainer.appendChild(badge);
  },

  _loginPath() {
    // Works from both /pages/ and root
    const depth = window.location.pathname.split("/").filter(Boolean).length;
    const prefix = window.location.pathname.includes("/pages/") ? "../" : "";
    return prefix + "pages/login.html";
  }
};

// ── Rate Limit ──
const RateLimit = {

  _key(username) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return RATE_KEY_PFX + (username || "guest") + "_" + today;
  },

  // How many uses today
  usedToday(username) {
    try { return parseInt(localStorage.getItem(this._key(username)) || "0", 10); }
    catch { return 0; }
  },

  // Remaining uses
  remaining(username, limit) {
    return Math.max(0, limit - this.usedToday(username));
  },

  // Check + consume one use. Returns { ok, remaining, limit }
  consume(username, limit) {
    const used = this.usedToday(username);
    if (used >= limit) {
      return { ok: false, remaining: 0, limit };
    }
    localStorage.setItem(this._key(username), String(used + 1));
    return { ok: true, remaining: limit - used - 1, limit };
  },

  // Guest (no login) limit = 3/day
  GUEST_LIMIT: 3,

  consumeGuest() {
    return this.consume("guest", this.GUEST_LIMIT);
  },
};

// ── Auto-init badge when DOM ready ──
document.addEventListener("DOMContentLoaded", () => {
  Auth.injectBadge();
});
