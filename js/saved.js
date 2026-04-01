/* ═══════════════════════════════════════════════
   Saved / Bookmark Logic — VangVieng Explorer
   Storage key: "vve_saved"
═══════════════════════════════════════════════ */

const STORAGE_KEY = "vve_saved";

// ── CLOUD SYNC HELPERS ──
async function syncSaveToCloud(place) {
  const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
  if (!session) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/saved_places`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: session.userId,
        place_id: place.id,
        place_data: place,
        saved_at: new Date().toISOString()
      })
    });
  } catch(e) { console.warn('Cloud sync failed:', e); }
}

async function syncRemoveFromCloud(placeId) {
  const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
  if (!session) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/saved_places?user_id=eq.${session.userId}&place_id=eq.${placeId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.accessToken}`
      }
    });
  } catch(e) { console.warn('Cloud remove failed:', e); }
}

async function loadSavedFromCloud() {
  const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
  if (!session) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/saved_places?user_id=eq.${session.userId}&select=place_id,place_data,saved_at`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${session.accessToken}` }
    });
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return;
    const saved = getSaved();
    rows.forEach(r => {
      if (r.place_data && !saved[String(r.place_data.id)]) {
        saved[String(r.place_data.id)] = { ...r.place_data, savedAt: new Date(r.saved_at).getTime() };
      }
    });
    setSaved(saved);
  } catch(e) { console.warn('Cloud load failed:', e); }
}

// ── READ / WRITE ──
function getSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function setSaved(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function isSaved(id) {
  return !!getSaved()[String(id)];
}

// ── TOGGLE ──
function toggleSave(place) {
  const saved = getSaved();
  const id = String(place.id);
  if (saved[id]) {
    delete saved[id];
    setSaved(saved);
    syncRemoveFromCloud(place.id);
    showToast("ລຶບອອກຈາກລາຍການແລ້ວ");
  } else {
    saved[id] = { ...place, savedAt: Date.now() };
    setSaved(saved);
    syncSaveToCloud(place);
    showToast("🔖 ບັນທຶກແລ້ວ!");
  }
  updateNavBadge();
}

// ── NAV BADGE ──
function updateNavBadge() {
  const n = Object.keys(getSaved()).length;
  document.querySelectorAll(".saved-badge").forEach(el => {
    el.textContent = n > 0 ? n : "";
    el.style.display = n > 0 ? "inline-flex" : "none";
  });
}

// ── TOAST ──
function showToast(msg) {
  let t = document.getElementById("vve-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "vve-toast";
    t.style.cssText = `
      position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(20px);
      background:#0a1f3d; color:#fff; padding:11px 22px;
      border-radius:99px; font-size:0.88rem; font-weight:600;
      opacity:0; pointer-events:none; z-index:9999;
      transition:all 0.25s ease; white-space:nowrap;
      font-family:'Outfit','Noto Sans Lao',sans-serif;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  t.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(t._t);
  t._t = setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(20px)";
  }, 2200);
}

// ── AUTO LOAD CLOUD ON SAVED PAGE ──
document.addEventListener('DOMContentLoaded', async () => {
  await loadSavedFromCloud();
  renderSavedPage();
  updateNavBadge();
});

// ── SAVED PAGE: RENDER ──
function renderSavedPage() {
  const grid = document.getElementById("savedGrid");
  if (!grid) return;

  const saved = getSaved();
  const items = Object.values(saved).sort((a, b) => b.savedAt - a.savedAt);

  // update count
  const countEl = document.getElementById("savedCount");
  if (countEl) countEl.textContent = items.length + " ສະຖານທີ່";

  const btnClear = document.getElementById("btnClear");
  const btnShare = document.getElementById("btnShare");
  if (btnClear) btnClear.disabled = items.length === 0;
  if (btnShare) btnShare.disabled = items.length === 0;

  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:80px 24px;">
        <div style="font-size:3.5rem; margin-bottom:20px;">🗺️</div>
        <h3 style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--dark);margin-bottom:10px;">
          ຍັງບໍ່ມີສະຖານທີ່ທີ່ບັນທຶກ
        </h3>
        <p style="font-size:0.9rem;color:var(--muted);margin-bottom:28px;line-height:1.7;">
          ໄປສຳຫຼວດ ແລ້ວກົດ 🔖 ໃສ່ສະຖານທີ່ທີ່ຢາກໄປ
        </p>
        <a href="explore.html"
          style="display:inline-block;padding:12px 32px;
          background:linear-gradient(135deg,var(--green-700),var(--green-500));
          color:#fff;border-radius:var(--radius-xl);font-size:0.95rem;font-weight:600;
          text-decoration:none;">
          ສຳຫຼວດສະຖານທີ່ →
        </a>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(p => {
    const date = new Date(p.savedAt).toLocaleDateString("lo-LA", {
      day: "numeric", month: "short", year: "numeric"
    });
    return `
      <div class="place-card" onclick="window.location.href='detail.html?id=${p.id}'">
        <div style="position:relative">
          <div style="background:${p.image_bg||'#e0f2ff'};width:100%;aspect-ratio:3/2;
            display:flex;align-items:center;justify-content:center;font-size:4rem;
            position:relative;overflow:hidden;">
            ${p.image_url
              ? `<img src="${p.image_url}" alt="${p.name}"
                  style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"
                  onerror="this.style.display='none'">`
              : (p.image_emoji || "📍")
            }
            <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.3) 100%)"></div>
          </div>
          ${p.is_eco ? '<span class="card-eco-badge">🌱 Eco</span>' : ""}
          ${p.rating ? `<span class="card-rating-badge">⭐ ${p.rating}</span>` : ""}
          <button
            onclick="event.stopPropagation(); toggleSave(${JSON.stringify(p).replace(/"/g,'&quot;')}); renderSavedPage()"
            style="position:absolute;bottom:10px;right:10px;z-index:3;
              background:rgba(255,255,255,0.92);border:none;border-radius:99px;
              padding:5px 12px;font-size:0.78rem;font-weight:700;color:#c0392b;
              cursor:pointer;font-family:inherit;backdrop-filter:blur(8px);">
            ✕ ລຶບອອກ
          </button>
        </div>
        <div class="card-body">
          <span class="card-cat">${getCatLabelSaved(p.category)}</span>
          <h3 class="card-title">${p.name}</h3>
          <div class="card-footer">
            <span class="card-price">${p.price_range || ""}</span>
            <span style="font-size:0.75rem;color:var(--muted)">${p.address || ""}</span>
          </div>
          <div style="font-size:0.72rem;color:var(--muted);margin-top:8px;
            padding-top:8px;border-top:1px solid var(--border);">
            🔖 ບັນທຶກ ${date}
          </div>
        </div>
      </div>`;
  }).join("");
}

function getCatLabelSaved(cat) {
  const map = { attraction:"🏔️ ສະຖານທີ່", hotel:"🏨 ທີ່ພັກ", restaurant:"🍜 ຮ້ານອາຫານ", activity:"🛶 ກິດຈະກຳ", cafe:"☕ Cafe" };
  return map[cat] || cat || "";
}

// ── SHARE ──
function shareList() {
  const items = Object.values(getSaved());
  if (!items.length) return;
  const text = "📍 ສະຖານທີ່ທີ່ຂ້ອຍຢາກໄປ ວັງວຽງ:\n\n" +
    items.map((p, i) => `${i+1}. ${p.name}`).join("\n") +
    "\n\n🌿 VangVieng Explorer";
  if (navigator.share) {
    navigator.share({ title: "ລາຍການທ່ຽວວັງວຽງ", text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast("📋 ຄັດລອກລາຍການແລ້ວ!"));
  }
}

// ── CLEAR ALL ──
function confirmClear() {
  if (!Object.keys(getSaved()).length) return;
  document.getElementById("modalOverlay")?.classList.add("open");
}
function closeModal() {
  document.getElementById("modalOverlay")?.classList.remove("open");
}
function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
  closeModal();
  showToast("ລ້າງລາຍການທັງໝົດແລ້ວ");
  renderSavedPage();
  updateNavBadge();
}
