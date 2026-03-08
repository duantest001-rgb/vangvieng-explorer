/* ═══════════════════════════════════════════════
   Detail Page Logic
═══════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
  setupNavbar();
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) { showError("ບໍ່ພົບ ID ສະຖານທີ່"); return; }
  await loadDetail(id);
});

async function loadDetail(id) {
  try {
    const place = await db.getPlaceById(id);
    if (!place) { showError("ບໍ່ພົບສະຖານທີ່ນີ້"); return; }
    renderDetail(place);
    document.title = `${place.name} — VangVieng Explorer`;
  } catch (err) {
    showError("ເຊື່ອມຕໍ່ຜິດພາດ");
  }
}

function renderDetail(p) {
  const catLabel = { attraction: "ສະຖານທີ່", hotel: "ທີ່ພັກ", restaurant: "ຮ້ານອາຫານ", activity: "ກິດຈະກຳ" }[p.category] || p.category;
  const mapSrc = `https://maps.google.com/maps?q=${p.lat},${p.lng}&z=15&output=embed`;

  document.getElementById("detailContent").innerHTML = `
    <div class="container">
      <div class="detail-hero" style="background:${p.image_bg || '#e0f2ff'}">
        ${p.image_emoji || "📍"}
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
          <p class="detail-desc">${p.description || "ຍັງບໍ່ມີລາຍລະອຽດ"}</p>

          <div class="detail-info-grid">
            <div class="info-item">
              <div class="info-label">⭐ Rating</div>
              <div class="info-value">${p.rating || "-"} / 5.0</div>
            </div>
            <div class="info-item">
              <div class="info-label">💰 ລາຄາ</div>
              <div class="info-value">${p.price_range || "-"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📍 ທີ່ຢູ່</div>
              <div class="info-value">${p.address || "-"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">🗂️ ປະເພດ</div>
              <div class="info-value">${catLabel}</div>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDEBAR -->
        <div class="detail-sidebar">
          <div class="sidebar-card">
            <h4>📍 ແຜນທີ່</h4>
            <div class="map-embed">
              <iframe src="${mapSrc}" allowfullscreen loading="lazy"></iframe>
            </div>
          </div>

          <div class="sidebar-card">
            <h4>🤖 ຖາມ AI</h4>
            <p style="font-size:0.85rem; color:var(--muted); margin-bottom:16px; line-height:1.6">
              ຢາກຮູ້ຂໍ້ມູນເພີ່ມເຕີມກ່ຽວກັບ ${p.name}? ຖາມ AI ໄດ້ເລີຍ
            </p>
            <a href="ai-chat.html?place=${encodeURIComponent(p.name)}" class="ai-suggest-btn">
              🤖 ຖາມ AI ກ່ຽວກັບທີ່ນີ້
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showError(msg) {
  document.getElementById("detailContent").innerHTML = `
    <div class="container" style="text-align:center; padding:80px 0">
      <div style="font-size:3rem; margin-bottom:16px">⚠️</div>
      <h3>${msg}</h3>
      <a href="explore.html" style="display:inline-block; margin-top:20px; color:var(--green-600); font-weight:600">← ກັບໄປສຳຫຼວດ</a>
    </div>`;
}

function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => navLinks.classList.toggle("open"));
  }
}
