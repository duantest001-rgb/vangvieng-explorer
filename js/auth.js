/* ═══════════════════════════════════════════════
   Auth — Supabase Auth v2
   VangVieng Explorer
═══════════════════════════════════════════════ */

const SUPABASE_URL = "https://axqgotrbnglssxhwkfjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_Jx8kMe3QiaBZ3rE9T7OHtA_hxrbgW5b";

// ── Supabase Auth helpers ──
const SupaAuth = {

  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "ເຂົ້າລະບົບຜິດພາດ");
    return data;
  },

  async signOut(accessToken) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${accessToken}` }
    });
  },

  async getProfile(accessToken) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=role,ai_limit`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${accessToken}` }
    });
    if (!res.ok) return { role: "user", ai_limit: 10 };
    const rows = await res.json();
    return rows[0] || { role: "user", ai_limit: 10 };
  },

  async refreshToken(refreshToken) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Token expired");
    return data;
  }
};

// ── Session key ──
const SESSION_KEY  = "vve_session";
const RATE_KEY_PFX = "vve_rate_";

// ── Auth ──
const Auth = {

  async login(email, password) {
    try {
      const tokenData = await SupaAuth.signIn(email, password);
      const profile   = await SupaAuth.getProfile(tokenData.access_token);
      const session = {
        userId:       tokenData.user.id,
        email:        tokenData.user.email,
        name:         tokenData.user.user_metadata?.name || tokenData.user.email.split("@")[0],
        role:         profile.role,
        limit:        profile.ai_limit,
        accessToken:  tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt:    Date.now() + (tokenData.expires_in * 1000),
        loginAt:      Date.now()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { ok: true, session };
    } catch (err) {
      return { ok: false, msg: err.message };
    }
  },

  async logout() {
    const session = this.getSession();
    if (session?.accessToken) {
      try { await SupaAuth.signOut(session.accessToken); } catch (_) {}
    }
    localStorage.removeItem(SESSION_KEY);
    window.location.href = this._loginPath();
  },

  getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this._tryRefresh(session);
        return null;
      }
      return session;
    } catch { return null; }
  },

  async _tryRefresh(session) {
    try {
      const t = await SupaAuth.refreshToken(session.refreshToken);
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        ...session,
        accessToken:  t.access_token,
        refreshToken: t.refresh_token,
        expiresAt:    Date.now() + (t.expires_in * 1000)
      }));
    } catch { localStorage.removeItem(SESSION_KEY); }
  },

  isLoggedIn() { return !!this.getSession(); },

  requireLogin() {
    if (!this.isLoggedIn())
      window.location.href = this._loginPath() + "?next=" + encodeURIComponent(window.location.href);
  },

  injectBadge() {
    const session = this.getSession();
    if (!session) return;
    document.getElementById("authBadge")?.remove();
    const badge = document.createElement("div");
    badge.id = "authBadge";
    badge.style.cssText = "display:flex;align-items:center;gap:8px;font-size:0.78rem;font-weight:600;color:var(--dark,#071830);cursor:pointer;";
    const roleEmoji   = { admin:"🔑", press:"🎤", user:"👤" }[session.role] || "👤";
    const remaining   = RateLimit.remaining(session.userId, session.limit);
    const limitBadge  = session.role === "admin" ? "" :
      `<span style="background:${remaining<=2?'#ffdede':'#e0f2ff'};color:${remaining<=2?'#c0392b':'#1050a0'};padding:1px 7px;border-radius:99px;font-size:0.72rem;font-weight:700;">AI ${remaining}/${session.limit}</span>`;
    badge.innerHTML = `${roleEmoji} ${session.name} ${limitBadge}
      <button onclick="Auth.logout()" style="background:none;border:1px solid #ccd;padding:2px 9px;border-radius:99px;font-size:0.7rem;cursor:pointer;color:inherit;font-family:inherit;">ອອກ</button>`;
    document.querySelector(".nav-container")?.appendChild(badge);
  },

  _loginPath() {
    const prefix = window.location.pathname.includes("/pages/") ? "../" : "";
    return prefix + "pages/login.html";
  }
};

// ── Rate Limit ──
const RateLimit = {
  _key(userId) {
    return RATE_KEY_PFX + (userId||"guest") + "_" + new Date().toISOString().slice(0,10);
  },
  usedToday(userId) {
    try { return parseInt(localStorage.getItem(this._key(userId))||"0",10); } catch { return 0; }
  },
  remaining(userId, limit) { return Math.max(0, limit - this.usedToday(userId)); },
  consume(userId, limit) {
    const used = this.usedToday(userId);
    if (used >= limit) return { ok:false, remaining:0, limit };
    localStorage.setItem(this._key(userId), String(used+1));
    return { ok:true, remaining:limit-used-1, limit };
  },
  GUEST_LIMIT: 3,
  consumeGuest() { return this.consume("guest", this.GUEST_LIMIT); }
};

document.addEventListener("DOMContentLoaded", () => Auth.injectBadge());
