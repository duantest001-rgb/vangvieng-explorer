/* ═══════════════════════════════════════════════
   Detail Page Logic
═══════════════════════════════════════════════ */

function t(key, replacements) {
  const lang = localStorage.getItem("lang") || "lo";
  let val = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
  if (replacements) Object.keys(replacements).forEach(k => val = val.replace(`{${k}}`, replacements[k]));
  return val;
}

document.addEventListener("DOMContentLoaded", async () => {
  setupNavbar();
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) { showError(t("error.not_found")); return; }
  await loadDetail(id);
});

async function loadDetail(id) {
  try {
    const place = await db.getPlaceById(id);
    if (!place) { showError(t("error.not_found")); return; }
    window._currentPlace = place;
    renderDetail(place);
    renderReviews(place.id, 'reviewContainer');
    document.title = `${place.name} — VangVieng Explorer`;
  } catch (err) {
    showError(t("error.db"));
  }
}

function getCatLabel(cat) {
  const map = { attraction: "cat.attraction", hotel: "cat.hotel", restaurant: "cat.restaurant", activity: "cat.activity" };
  return map[cat] ? t(map[cat]) : cat;
}

function renderDetail(p) {
  const catLabel = getCatLabel(p.category);
  const mapSrc = `https://maps.google.com/maps?q=${p.lat},${p.lng}&z=15&output=embed`;

  document.getElementById("detailContent").innerHTML = `
    <div class="container">
     <div class="detail-hero" style="background:${p.image_bg || '#e0f2ff'}; position:relative; overflow:hidden;">
        ${p.image_url
          ? `<img src="${p.image_url}" alt="${p.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
          : ''
        }
        <span style="position:relative;z-index:1;font-size:4rem">${p.image_url ? '' : (p.image_emoji || '📍')}</span>
      </div>
      <div class="detail-layout">
        <!-- LEFT -->
        <div class="detail-left">
          <div class="detail-badge-row">
            <span class="detail-cat">${catLabel}</span>
            ${p.is_eco ? '<span class="detail-eco">🌱 Eco Friendly</span>' : ''}
          </div>
          <h1 class="detail-title">${p.name}</h1>
          ${p.name_en ? `<p class="detail-title-en">${p.name_en}</p>` : ''}
          <p class="detail-desc">${p.description || t("detail.no_desc")}</p>
          <div class="detail-info-grid">
            <div class="info-item">
              <div class="info-label">⭐ ${t("detail.rating")}</div>
              <div class="info-value">${p.rating || "-"} / 5.0</div>
            </div>
            <div class="info-item">
              <div class="info-label">💰 ${t("detail.price")}</div>
              <div class="info-value">${p.price_range || "-"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📍 ${t("detail.address")}</div>
              <div class="info-value">${p.address || "-"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">🗂️ ${t("detail.type")}</div>
              <div class="info-value">${catLabel}</div>
            </div>
            ${p.opening_hours ? `
            <div class="info-item">
              <div class="info-label">⏰ ເວລາເປີດ-ປິດ</div>
              <div class="info-value">${p.opening_hours}</div>
            </div>` : ''}
          </div>
          <!-- REVIEWS -->
          <div id="reviewContainer"></div>
        </div>
        <!-- RIGHT SIDEBAR -->
        <div class="detail-sidebar">
          <div class="sidebar-card">
            <h4>📍 ${t("detail.map")}</h4>
            <div class="map-embed">
              <iframe src="${mapSrc}" allowfullscreen loading="lazy"></iframe>
            </div>
          </div>
          <div class="sidebar-card">
            <h4>🤖 ${t("detail.ask_ai")}</h4>
            <p style="font-size:0.85rem; color:var(--muted); margin-bottom:16px; line-height:1.6">
              ${t("detail.ai_desc", { name: p.name })}
            </p>
            <a href="ai-chat.html?place=${encodeURIComponent(p.name)}" class="ai-suggest-btn">
              🤖 ${t("detail.ai_btn")}
            </a>
            <button
              id="bmBtn"
              onclick="toggleSave(window._currentPlace); const s=isSaved(window._currentPlace.id); this.textContent=s?'🔖 ບັນທຶກແລ້ວ':'🔖 ບັນທຶກສະຖານທີ່ນີ້'; this.style.background=s?'var(--green-700)':'var(--green-100)'; this.style.color=s?'#fff':'var(--green-700)'"
              style="display:block;width:100%;padding:13px;margin-top:12px;
                background:${isSaved(p.id)?'var(--green-700)':'var(--green-100)'};
                color:${isSaved(p.id)?'#fff':'var(--green-700)'};
                border:1.5px solid var(--green-300);border-radius:var(--radius-md);
                font-size:0.9rem;font-weight:600;font-family:var(--font-body);
                text-align:center;cursor:pointer;transition:var(--transition);"
            >${isSaved(p.id) ? '🔖 ບັນທຶກແລ້ວ' : '🔖 ບັນທຶກສະຖານທີ່ນີ້'}</button>
          </div>
          <div class="sidebar-card">
            <h4>📤 ແຊຣ໌ສະຖານທີ່ນີ້</h4>
            <div class="share-grid">
              <button class="share-btn share-copy" onclick="sharePlace('copy')">📋 Copy Link</button>
              <button class="share-btn share-native" onclick="sharePlace('native')">📱 Share</button>
              <button class="share-btn share-fb" onclick="sharePlace('facebook')">Facebook</button>
              <button class="share-btn share-line" onclick="sharePlace('line')">Line</button>
              <button class="share-btn share-wa" onclick="sharePlace('whatsapp')">WhatsApp</button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── SHARE ──
function sharePlace(method) {
  const p    = window._currentPlace;
  if (!p) return;
  const base = 'https://duantest001-rgb.github.io/vangvieng-explorer';
  const url  = `${base}/pages/detail.html?id=${p.id}`;
  const text = `🌿 ${p.name} — ສະຖານທີ່ທ່ຽວວັງວຽງ\n${p.description ? p.description.slice(0,80) + '...' : ''}\n${url}`;
  const enc  = encodeURIComponent(url);
  const etxt = encodeURIComponent(`🌿 ${p.name} — VangVieng Explorer\n${url}`);

  if (method === 'copy') {
    navigator.clipboard.writeText(url).then(() => {
      showToast('📋 ຄັດລອກ URL ແລ້ວ!');
    });
  } else if (method === 'native' && navigator.share) {
    navigator.share({ title: p.name, text: `ສະຖານທີ່ທ່ຽວວັງວຽງ — ${p.name}`, url }).catch(() => {});
  } else if (method === 'native') {
    navigator.clipboard.writeText(url).then(() => {
      showToast('📋 ຄັດລອກ URL ແລ້ວ!');
    });
  } else if (method === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${enc}`, '_blank', 'width=600,height=400');
  } else if (method === 'line') {
    window.open(`https://social-plugins.line.me/lineit/share?url=${enc}`, '_blank', 'width=600,height=400');
  } else if (method === 'whatsapp') {
    window.open(`https://wa.me/?text=${etxt}`, '_blank');
  }
}

function showError(msg) {
  document.getElementById("detailContent").innerHTML = `
    <div class="container" style="text-align:center; padding:80px 0">
      <div style="font-size:3rem; margin-bottom:16px">⚠️</div>
      <h3>${msg}</h3>
      <a href="explore.html" style="display:inline-block; margin-top:20px; color:var(--green-600); font-weight:600">← ${t("detail.back")}</a>
    </div>`;
}

function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => navLinks.classList.toggle("open"));
  }
  updateNavBadge();
}
