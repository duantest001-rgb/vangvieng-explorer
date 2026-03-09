/* ═══════════════════════════════════════════════
   AI Chat Logic — Gemini API (Free Tier)
   ⚠️ ໃສ່ Gemini API Key ຂອງຕົນເອງທີ່ GEMINI_KEY
═══════════════════════════════════════════════ */

// ── CONFIG ──
// ໄປຮັບ free API key ທີ່: https://aistudio.google.com/app/apikey
const GEMINI_KEY = "AIzaSyCcXrjErae0Po-4TxAMvWzpID25ytPz_eA";
const GEMINI_URL = `https://gemini-proxy.duan-test001.workers.dev`;

// System prompt — ໃຫ້ AI ຮູ້ context ວັງວຽງ
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
let isLoading   = false;

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
  setupNavbar();
  setupInput();

  // ຖ້າມາຈາກ detail page ກັບ ?place=xxx
  const params = new URLSearchParams(window.location.search);
  const place  = params.get("place");
  if (place) {
    document.getElementById("chatInput").value = `ບອກຂໍ້ມູນກ່ຽວກັບ ${place} ໃຫ້ຂ້ອຍຫນ້ອຍ`;
    sendMessage();
  }
});

// ── SEND MESSAGE ──
async function sendMessage() {
  const input = document.getElementById("chatInput");
  const text  = input.value.trim();
  if (!text || isLoading) return;

  // Check API key
  if (GEMINI_KEY === "YOUR_GEMINI_API_KEY") {
    appendMessage("bot", `⚠️ ຍັງບໍ່ໄດ້ຕັ້ງ Gemini API Key\n\nໄປຮັບ key ຟຣີທີ່: <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--green-600)">aistudio.google.com</a>\nແລ້ວໃສ່ໃນໄຟລ໌ js/ai-chat.js ທີ່ GEMINI_KEY`, true);
    return;
  }

  // Add user message
  appendMessage("user", text);
  input.value = "";
  autoResize(input);
  input.focus();

  // Hide suggestions after first message
  document.getElementById("quickSugg").style.display = "none";

  // Add to history
  chatHistory.push({ role: "user", parts: [{ text }] });

  // Show typing
  const typingId = showTyping();
  isLoading = true;
  document.getElementById("sendBtn").disabled = true;

  try {
    const reply = await callGemini();
    removeTyping(typingId);
    appendMessage("bot", reply);
    chatHistory.push({ role: "model", parts: [{ text: reply }] });
  } catch (err) {
    removeTyping(typingId);
    appendMessage("bot", "⚠️ ຂໍໂທດ ເກີດຂໍ້ຜິດພາດ ລອງໃໝ່ອີກຄັ້ງ", false, true);
  } finally {
    isLoading = false;
    document.getElementById("sendBtn").disabled = false;
  }
}

// ── CALL GEMINI API ──
async function callGemini() {
  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: chatHistory,
    generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "API error");
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "ບໍ່ໄດ້ຮັບຄຳຕອບ";
}

// ── APPEND MESSAGE ──
function appendMessage(role, text, isHTML = false, isError = false) {
  const msgs = document.getElementById("chatMessages");
  const row  = document.createElement("div");
  row.className = `msg-row ${role}`;

  const avatar  = role === "bot" ? "✨" : "👤";
  const bubbleClass = role === "bot"
    ? `msg-bubble bot-bubble${isError ? " error-bubble" : ""}`
    : "msg-bubble user-bubble";

  const formatted = isHTML ? text : formatText(text);

  row.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="${bubbleClass}">${formatted}</div>
  `;
  msgs.appendChild(row);
  msgs.scrollTop = msgs.scrollHeight;
}

// ── FORMAT TEXT ──
function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>")
    .replace(/^[-•]\s(.+)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
}

// ── TYPING INDICATOR ──
function showTyping() {
  const msgs = document.getElementById("chatMessages");
  const id   = "typing-" + Date.now();
  const row  = document.createElement("div");
  row.className = "msg-row bot";
  row.id = id;
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

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

// ── QUICK SUGGESTION ──
function sendSuggestion(btn) {
  document.getElementById("chatInput").value = btn.textContent;
  sendMessage();
}

// ── INPUT SETUP ──
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

// ── NAVBAR ──
function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => navLinks.classList.toggle("open"));
  }
}
