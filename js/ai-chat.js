
// ── UPSELL POPUP ──
function showUpsellPopup(session) {
  document.getElementById('upsellPopup')?.remove();

  const isGuest = !session;
  const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';

  const popup = document.createElement('div');
  popup.id = 'upsellPopup';
  popup.style.cssText = `
    position:fixed;inset:0;background:rgba(7,24,48,0.7);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:1rem;
    animation:fadeIn .25s ease;
  `;
  popup.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:2rem 1.8rem;max-width:360px;width:100%;
      box-shadow:0 24px 60px rgba(7,24,48,0.3);animation:slideUp .3s cubic-bezier(.16,1,.3,1);">
      <div style="text-align:center;margin-bottom:1.2rem;">
        <div style="font-size:2.5rem;margin-bottom:8px;">🤖</div>
        <h2 style="font-size:1.2rem;font-weight:700;color:#071830;margin-bottom:6px;">
          ໝົດໂຄຕ້າ AI ວັນນີ້
        </h2>
        <p style="font-size:0.85rem;color:#6b7a99;">
          ${isGuest ? 'Guest ໃຊ້ AI ໄດ້ 3 ຄັ້ງ/ວັນ' : 'ທ່ານໃຊ້ AI ຄົບ ' + (session?.limit||10) + ' ຄັ້ງ/ວັນ'}
        </p>
      </div>

      ${isGuest ? `
      <div style="background:#f0f6ff;border-radius:14px;padding:1rem;margin-bottom:1rem;">
        <div style="font-weight:700;color:#1050a0;margin-bottom:8px;">👤 Free Member</div>
        <div style="font-size:0.82rem;color:#3a4a6b;line-height:1.7;">
          ✅ AI 10 ຄັ້ງ/ວັນ<br>
          ✅ ຂຽນ Review ໄດ້<br>
          ✅ Booking ໄດ້<br>
          ✅ Save places cloud<br>
          <strong style="color:#1050a0;">ຟຣີ 100%</strong>
        </div>
      </div>
      ` : ''}

      <div style="background:linear-gradient(135deg,#fff8e1,#fff3cc);border:1.5px solid #ffd54f;
        border-radius:14px;padding:1rem;margin-bottom:1.2rem;">
        <div style="font-weight:700;color:#b8860b;margin-bottom:8px;">⭐ Premium Member</div>
        <div style="font-size:0.82rem;color:#7a5800;line-height:1.7;">
          ✅ AI 50 ຄັ້ງ/ວັນ<br>
          ✅ Priority Booking<br>
          ✅ Premium Badge<br>
          ✅ ທຸກ feature<br>
          <strong style="color:#b8860b;">ເປີດຕົວເร็ວໆນີ້ 🔜</strong>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        ${isGuest ? `
        <a href="${loginPath}" style="display:block;text-align:center;padding:13px;
          background:linear-gradient(135deg,#1050a0,#1a6bbf);color:#fff;border-radius:12px;
          font-weight:700;font-size:0.95rem;text-decoration:none;">
          🚀 ສ້າງ Account ຟຣີ
        </a>
        ` : `
        <div style="text-align:center;padding:11px;background:#f0f6ff;border-radius:12px;
          font-size:0.85rem;color:#1050a0;font-weight:600;">
          🔜 Premium ເປີດຕົວເ soon
        </div>
        `}
        <button onclick="document.getElementById('upsellPopup').remove()"
          style="padding:11px;background:#f5f7fa;border:none;border-radius:12px;
          font-size:0.88rem;color:#6b7a99;cursor:pointer;font-family:inherit;font-weight:600;">
          ⏰ ລໍຖ້າມື້ອື່ນ
        </button>
      </div>
    </div>
  `;

  // Close on backdrop click
  popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  document.body.appendChild(popup);
}

/* ═══════════════════════════════════════════════
   AI Chat Logic — v2 (streaming effect + polish)
═══════════════════════════════════════════════ */

// Cloudflare Worker proxy → Anthropic Claude API
// Cloudflare Worker proxy → Anthropic Claude API
const AI_PROXY_URL = "https://api.lao-trips.com";

const SYSTEM_PROMPT = `ເຈົ້າຄື "ນ້ອງວຽງ" — AI Travel Guide ສ່ວນຕົວຂອງ VangVieng Explorer ທີ່ຮູ້ຈັກວັງວຽງດີທີ່ສຸດ.
ເຈົ້າຄືຄົນທ້ອງຖິ່ນທີ່ໄດ້ທ່ຽວທຸກທີ່ ກິນທຸກຮ້ານ ຮູ້ທຸກ tip — ລົມສະໄຕລ໌ friendly, warm, ຄືໝູ່.

═══ ກົດລະບຽບຫຼັກ ═══
- ຕອບຕາມພາສາທີ່ຜູ້ໃຊ້ຖາມ (ລາວ/ອັງກິດ/ໄທ/ຈີນ/ເກົາຫຼີ)
- ຕອບກ່ຽວກັບວັງວຽງ ແລະ ລາວເທົ່ານັ້ນ
- ຖ້າບໍ່ຮູ້ຈິງໆ ໃຫ້ບອກຕົງໆ ຢ່າ guess
- ຈຳຊື່ຜູ້ໃຊ້ທີ່ບອກໃນການສົນທະນານີ້ ແລ້ວເອີ້ນຊື່ທຸກຄັ້ງ
- ຄັ້ງທຳອິດທີ່ຜູ້ໃຊ້ບອກຊື່ ຕອບວ່າ "ຍິນດີຮູ້ຈັກ [ຊື່]! 😊" ກ່ອນຕອບ

═══ ສະຖານທີ່ທ່ອງທ່ຽວ ═══

🏔️ ທຳມະຊາດ & ຖ້ຳ:
- ຖ້ຳທາມພູຄາມ (Tham Phu Kham): ຖ້ຳໃຫຍ່ + Blue Lagoon 1 ຕິດກັນ | ເຂົ້າ 15,000 kip | ເປີດ 08:00-17:00 | ຫ່າງ ~6km | ຂ້າມສົ້ງ/ລົດຈັກ
- Blue Lagoon 1: ນ້ຳສີຟ້າໃສ | ເຂົ້າ 10,000 kip | ລອຍນ້ຳໄດ້ | ດີສຸດຕອນເຊົ້າກ່ອນຄົນຫຼາຍ
- Blue Lagoon 2: ງຽບກວ່າ BL1 | ທຳມະຊາດກວ່າ | ເຂົ້າ 10,000 kip | ຕ້ອງໃຊ້ລົດຈັກ
- Blue Lagoon 3: ໄກ ~15km | ນ້ຳໃສ ຄົນໜ້ອຍ | ເໝາະຄົນທີ່ຢາກຫຼີກຫຼ່ຽງ crowd
- ຖ້ຳທາມຈາງ (Tham Chang): ໃກ້ໃຈກາງ | ເຂົ້າ 10,000 kip | ເປີດ 08:00-17:00
- ພູນາງນອນ (Sleeping Woman): ເບິ່ງຈາກໃຈກາງ | ສວຍ golden hour
- ທົ່ງນາ Nam Song: ຊີ່ bike ຜ່ານທຸ່ງນາ + view ພູ | ~5km | ດີ morning/sunset

🏖️ ຫາດ/ລໍາແຄມນໍ້າ:
- Organic Farm Beach: ລໍາແຄມ Nam Song | ຟຣີຖ້ານັ່ງດື່ມ | view ພູ
- Vang Vieng Lagoon: ເໝາະຄອບຄົວ | ເຂົ້າ 20,000 kip

═══ ກິດຈະກຳ + ລາຄາ ═══

🪂 Adventure:
- Kayak/Tubing Nam Song: ເຄິ່ງວັນ 80,000-120,000 kip/ຄົນ | full day 150,000+
- Zipline (VangVieng Zipline Adventure): 350,000-500,000 kip | 3-4 ຊົ່ວໂມງ | book ລ່ວງໜ້າ
- Hot Air Balloon: 600,000-800,000 kip/ຄົນ | book ລ່ວງໜ້າ | ບິນ 06:00 | ຂຶ້ນກັບລົມ
- ATV/Quad Bike: 150,000-250,000 kip/ຊົ່ວໂມງ
- Rock Climbing: 200,000-300,000 kip | instructor ມີ
- Mountain Bike rent: 30,000-50,000 kip/ວັນ

🍳 ປະສົບການ:
- Lao Cooking Class: 200,000-300,000 kip | 3-4 ຊົ່ວໂມງ
- Monk Alms Giving: ຕອນເຊົ້າ 06:00 | ຟຣີ | ຂໍໃຫ້ respectful

═══ ຮ້ານອາຫານ + ດື່ມ ═══

🍜 ອາຫານລາວ/ທ້ອງຖິ່ນ:
- ຮ້ານສ່ວງໃຈ: ຕຳໝາກຫຸ່ງ + ໄກ່ຍ່າງ ດັງທີ່ສຸດ | ຖ. 13 | $
- Nisha Restaurant: ໝີ່ + ເຂົ້າປຽກ | ໃກ້ຕະຫຼາດເຊົ້າ | $
- Night Market: BBQ + ສ້ວຍ + fresh juice | 17:00-22:00 | $

☕ Cafe/Western:
- The Hive Cafe: coffee specialty + smoothie | view ດີ | $$
- Organic Mulberry Farm: ກິນ organic + ຊາໝາກ | ~3km | $$
- Gary's Irish Bar: Western + sport TV | $$
- Kangaroo Sunset Bar: cocktail + sunset view | ລໍາແຄມນໍ້າ | $$

═══ ທີ່ພັກ ═══

💰 Budget (100,000-200,000 kip/ຄືນ):
- Champa Guesthouse: ສະອາດ + ໃຈກາງ + wifi ດີ
- Backpacker Hostel: dorm ຖືກ | ຮູ້ຈັກນັກທ່ອງທ່ຽວ

🏨 Mid-range (300,000-600,000 kip/ຄືນ):
- Riverside Boutique Resort: view Nam Song | ສະລອຍນໍ້າ | ຄຸ້ມ
- Vang Vieng Holiday Hotel: ໃຈກາງ | ສະອາດ

🌿 Eco/Boutique:
- Eco Lodge: ທຳມະຊາດ | bungalow | ຫ່າງ crowd | $$$

═══ ການເດີນທາງ ═══

🚌 ມາ/ໄປ:
- VTE → ວັງວຽງ: VIP bus 50,000-70,000 kip | 3-4 ຊົ່ວໂມງ | Northern Bus Terminal
- ລົດໄຟ: ສະຖານີ Phonhong (~25km) → tuk-tuk ເຂົ້າ | ~35 ນາທີຈາກ VTE
- Luang Prabang → ວັງວຽງ: bus ~6-7 ຊົ່ວໂມງ

🛺 ໃນໃຈກາງ:
- Tuk-tuk: 20,000-50,000 kip/ເທື່ອ
- ລົດຈັກ rent: 80,000-120,000 kip/ວັນ | ຕ້ອງ license
- Bicycle rent: 20,000-30,000 kip/ວັນ

═══ Tips ສຳຄັນ ═══

⚠️ ຕ້ອງຮູ້:
- ເງິນ: LAK/USD/Baht ຮັບສ່ວນຫຼາຍ | ATM ມີໃຈກາງ
- ໂທລະສັບ: ຊື້ sim Unitel ທີ່ສະໜາມບິນ ~30,000 kip
- ອາກາດ: Dry season (ຕ.ລ-ມ.ສ) ດີທີ່ສຸດ | Rainy (ມ.ຖ-ກ.ຍ) ຂຽວ ແຕ່ຖ້ຳບາງທີ່ປິດ
- ເສື້ອຜ້າ: ສຸພາບໃສ່ວັດ | ເອົາເສື້ອລ່ອນໄປຖ້ຳ/ຫາດ
- ລະວັງ: ລົດໄວໃນໃຈກາງ | ໜ້ານໍ້າ BL ລື່ນ | ຢ່າໄວ້ຂອງລາຄາໃນລົດຈັກ

💡 Hidden gems:
- Phangern Viewpoint: ~8km | sunrise ສວຍ | ຄົນໜ້ອຍ
- Pha Ngern: hike ເຄິ່ງວັນ | view 360°
- Kaeng Nyui Waterfall: ~15km | ດີ rainy season | 10,000 kip

═══ ການຈຳຊື່ຜູ້ໃຊ້ ═══
- ຖ້າຜູ້ໃຊ້ບອກຊື່ → ຈຳໄວ້ ແລ້ວເອີ້ນຊື່ໃນຄຳຕອບຕໍ່ໄປ
- ຖ້າຍັງບໍ່ຮູ້ຊື່ ຖາມໄດ້ຕາມທຳມະຊາດ
- ຢ່າ force ຖາມຊື່ທຸກຄຳຕອບ`;

// ── STATE ──
let chatHistory = [];
let isLoading = false;

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();
  setupInput();
  updateRateBadge();
  const params = new URLSearchParams(window.location.search);
  const place = params.get("place");
  if (place) {
    document.getElementById("chatInput").value = `ບອກຂໍ້ມູນກ່ຽວກັບ ${place} ໃຫ້ຂ້ອຍຫນ້ອຍ`;
    sendMessage();
  }
});

// ── RATE LIMIT UI ──
function updateRateBadge() {
  const session = (typeof Auth !== "undefined") ? Auth.getSession() : null;
  const username = session ? session.userId : "guest";
  const limit    = session ? session.limit    : RateLimit.GUEST_LIMIT;
  const remaining = RateLimit.remaining(username, limit);
  const el = document.getElementById("rateLimitInfo");
  if (!el) return;
  if (session?.role === "admin") { el.style.display = "none"; return; }
  el.style.display = "flex";
  el.innerHTML = `
    <span style="font-size:0.75rem; color:${remaining <= 2 ? '#c0392b' : '#4a6fa5'}; font-weight:600;">
      🤖 AI ວັນນີ້: <strong>${remaining}/${limit}</strong> ຄັ້ງທີ່ຍັງເຫຼືອ
      ${remaining === 0 ? ' — <span style="color:#c0392b">ໝົດໂຄຕ້າແລ້ວ</span>' : ''}
    </span>`;
}

// ── SEND MESSAGE ──
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text || isLoading) return;

  // ── Rate limit check ──
  const session  = (typeof Auth !== "undefined") ? Auth.getSession() : null;
  const username = session ? session.userId : "guest";
  const limit    = session ? session.limit    : RateLimit.GUEST_LIMIT;

  if (session?.role !== "admin") {
    const check = RateLimit.consume(username, limit);
    if (!check.ok) {
      appendMessage("bot",
        `⛔ **ໝົດໂຄຕ້າ AI ປະຈຳວັນ** (${limit} ຄັ້ງ/ວັນ)\n\n` +
        `ມາໃໝ່ໄດ້ພຣຸ່ງນີ້ ຫຼື <a href="login.html" style="color:#1050a0;font-weight:700;">login ດ້ວຍ account ທີ່ມີໂຄຕ້າຫຼາຍກວ່ານີ້</a>`,
        true
      );
      return;
    }
    updateRateBadge();
  }

  appendMessage("user", text);
  input.value = "";
  autoResize(input);
  input.focus();
  document.getElementById("quickSugg").style.display = "none";
  chatHistory.push({ role: "user", content: text });

  const typingId = showTyping();
  isLoading = true;
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.disabled = true;
  sendBtn.style.opacity = "0.5";

  try {
    const reply = await callClaude();
    removeTyping(typingId);
    await typewriterMessage(reply); // ✨ streaming effect
    chatHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    removeTyping(typingId);
    const errMsg = err?.message || String(err);
    appendMessage("bot", "⚠️ Error: " + errMsg + " — <button onclick='retryLast()' style='background:none;border:none;color:var(--green-400);cursor:pointer;font-weight:700;text-decoration:underline;font-family:inherit;'>ລອງໃໝ່</button>", true, true);
    console.error("Claude error:", err);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
  }
}

// ── RETRY LAST MESSAGE ──
function retryLast() {
  const lastUser = [...chatHistory].reverse().find(m => m.role === "user");
  if (!lastUser) return;
  // Remove last user msg from history so it re-sends cleanly
  const lastIdx = chatHistory.lastIndexOf(lastUser);
  chatHistory.splice(lastIdx, 1);
  // Remove error bubble from DOM
  const msgs = document.getElementById("chatMessages");
  const lastBubbles = msgs.querySelectorAll(".msg-row");
  if (lastBubbles.length) lastBubbles[lastBubbles.length - 1].remove();
  // Re-populate input and send
  document.getElementById("chatInput").value = lastUser.content;
  sendMessage();
}

// ── CALL CLAUDE ──
async function callClaude() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const body = { system: SYSTEM_PROMPT, messages: chatHistory };
    const res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error("format error: " + text.slice(0, 100)); }
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || "API error " + res.status);
    }
    return data.content?.[0]?.text || "ບໍ່ໄດ້ຮັບຄຳຕອບ";
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error("ໝົດເວລາ — ລອງໃໝ່");
    throw err;
  }
}

// ── TYPEWRITER EFFECT ──
async function typewriterMessage(text) {
  const msgs = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = "msg-row bot";
  row.innerHTML = `<div class="msg-avatar">✨</div><div class="msg-bubble bot-bubble" id="typeTarget"></div>`;
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;

  const target = document.getElementById("typeTarget");
  const formatted = formatText(text);

  // Fast typewriter — reveal HTML char by char (visible chars only)
  const words = text.split(" ");
  let built = "";
  for (let i = 0; i < words.length; i++) {
    built += (i > 0 ? " " : "") + words[i];
    target.innerHTML = formatText(built) + '<span class="cursor-blink">▌</span>';
    msgs.scrollTop = msgs.scrollHeight;
    await sleep(18 + Math.random() * 12);
  }
  target.innerHTML = formatted; // final clean render
  msgs.scrollTop = msgs.scrollHeight;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── APPEND MESSAGE ──
function appendMessage(role, text, isHTML = false, isError = false) {
  const msgs = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = `msg-row ${role}`;
  const avatar = role === "bot" ? "✨" : "👤";
  const bubbleClass = role === "bot"
    ? `msg-bubble bot-bubble${isError ? " error-bubble" : ""}`
    : "msg-bubble user-bubble";
  const formatted = isHTML ? text : formatText(text);
  row.innerHTML = `<div class="msg-avatar">${avatar}</div><div class="${bubbleClass}">${formatted}</div>`;
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
}

// ── FORMAT TEXT ──
function formatText(text) {
  let t = text;
  t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.*?)\*/g, "<em>$1</em>");
  t = t.replace(/`([^`]+)`/g, "<code style=\"background:#e0f2ff;color:#1050a0;padding:1px 5px;border-radius:4px;font-size:0.85em;\">$1</code>");
  t = t.replace(/^### (.+)$/gm, "<div style=\"font-weight:700;font-size:0.92rem;color:#071830;margin:8px 0 3px;\">$1</div>");
  t = t.replace(/^## (.+)$/gm,  "<div style=\"font-weight:700;font-size:0.98rem;color:#071830;margin:10px 0 5px;\">$1</div>");
  t = t.replace(/^# (.+)$/gm,   "<div style=\"font-weight:800;font-size:1rem;color:#071830;margin:10px 0 5px;\">$1</div>");
  t = t.replace(/^(\d+)\.\s(.+)$/gm, "<div style=\"padding:2px 0;\"><span style=\"font-weight:700;color:#1a6bbf;\">$1.</span> $2</div>");
  t = t.replace(/^[-•]\s(.+)$/gm, "<div style=\"padding:2px 0 2px 2px;\">• $1</div>");
  t = t.replace(/^---$/gm, "<hr style=\"border:none;border-top:1px solid #bde0f8;margin:8px 0;\">");
  t = t.replace(/\n{2,}/g, "<br>");
  t = t.replace(/\n/g, "<br>");
  return t;
}

// ── TYPING INDICATOR (animated dots) ──
function showTyping() {
  const msgs = document.getElementById("chatMessages");
  const id = "typing-" + Date.now();
  const row = document.createElement("div");
  row.className = "msg-row bot"; row.id = id;
  row.innerHTML = `
    <div class="msg-avatar">✨</div>
    <div class="msg-bubble bot-bubble typing-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}
function removeTyping(id) { document.getElementById(id)?.remove(); }

// ── SUGGESTIONS ──
function sendSuggestion(btn) {
  document.getElementById("chatInput").value = btn.textContent;
  sendMessage();
}

// ── INPUT — char counter + auto resize ──
function setupInput() {
  const input = document.getElementById("chatInput");
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener("input", () => autoResize(input));
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

// ── NAVBAR — X animation ──
function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      hamburger.classList.toggle("active", isOpen);
    });
    navLinks.querySelectorAll(".nav-link").forEach(l => l.addEventListener("click", () => {
      navLinks.classList.remove("open");
      hamburger.classList.remove("active");
    }));
  }
}

