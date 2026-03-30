/* ═══════════════════════════════════════════════
   AI Chat Logic — v2 (streaming effect + polish)
═══════════════════════════════════════════════ */

const CLAUDE_URL = "https://gemini-proxy.duan-test001.workers.dev";

const SYSTEM_PROMPT = `ເຈົ້າຄື AI Travel Assistant ຂອງ VangVieng Explorer — platform ທ່ອງທ່ຽວ eco-tourism ສຳລັບວັງວຽງ, ລາວ.

ກົດລະບຽບ:
- ຕອບໄດ້ທັງພາສາລາວ ແລະ ອັງກິດ (ຕາມພາສາທີ່ຜູ້ໃຊ້ຖາມ)
- ຕອບກ່ຽວກັບ ວັງວຽງ ເທົ່ານັ້ນ
- ໃຫ້ຂໍ້ມູນ practical, ຊັດເຈນ, ໃຊ້ emoji ໜ້ອຍໆ
- ຖ້າບໍ່ຮູ້ ໃຫ້ບອກຕົງໆ ຢ່າ guess

ຂໍ້ມູນທີ່ຮູ້:
- ສະຖານທີ່: ຖ້ຳທາມພູຄາມ, Blue Lagoon 1&2, ພູນາງນອນ, ຖ້ຳທາມຈາງ, ທົ່ງນາ
- ກິດຈະກຳ: Kayak, Zipline, Hot Air Balloon, Mountain Bike, Cooking Class
- ອາຫານ: ຮ້ານສ່ວງໃຈ, Organic Farm, Night Market, The Hive Cafe
- ທີ່ພັກ: Riverside Boutique, Eco Lodge, Champa Guesthouse
- ລາຄາ: $ = ຖືກ (<100k kip), $$ = ກາງ, $$$ = ແພງ
- ເດືອນດີທີ່ສຸດ: ຕ.ລ - ມ.ສ (dry season)`;

// ── STATE ──
let chatHistory = [];
let isLoading = false;

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();
  setupInput();
  const params = new URLSearchParams(window.location.search);
  const place = params.get("place");
  if (place) {
    document.getElementById("chatInput").value = `ບອກຂໍ້ມູນກ່ຽວກັບ ${place} ໃຫ້ຂ້ອຍຫນ້ອຍ`;
    sendMessage();
  }
});

// ── SEND MESSAGE ──
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text || isLoading) return;

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
    appendMessage("bot", "⚠️ ເກີດຂໍ້ຜິດພາດ — ກວດ internet ແລ້ວ <button onclick='retryLast()' style='background:none;border:none;color:var(--green-400);cursor:pointer;font-weight:700;text-decoration:underline;font-family:inherit;'>ລອງໃໝ່</button>", true, true);
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
    const res = await fetch(CLAUDE_URL, {
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

