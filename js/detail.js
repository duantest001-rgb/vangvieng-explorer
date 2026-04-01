/* ═══════════════════════════════════════════════
   Detail Page Logic v2 — Gallery + Share + Reviews
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
    incrementView(place.id);
  } catch {
    showError(t("error.db"));
  }
}

function getCatLabel(cat) {
  const map = { attraction: "cat.attraction", hotel: "cat.hotel", restaurant: "cat.restaurant", activity: "cat.activity" };
  return map[cat] ? t(map[cat]) : cat;
}

// ── RENDER GALLERY ──
function renderGallery(p) {
  // Collect all images: main + gallery array
  const imgs = [];
  if (p.image_url) imgs.push(p.image_url);
  if (p.gallery && Array.isArray(p.gallery)) imgs.push(...p.gallery);
  // If only 1 image — show hero style, no gallery strip
  if (imgs.length <= 1) {
    return `
      <div class="detail-hero" style="background:${p.image_bg || '#e0f2ff'}; position:relative; overflow:hidden; cursor:${imgs.length?'zoom-in':'default'};"
           ${imgs.length ? `onclick="openGalleryLightbox(0)"` : ''}>
        ${imgs[0]
          ? `<img src="${imgs[0]}" alt="${p.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" loading="eager" onerror="this.style.display='none'">`
          : `<span style="position:relative;z-index:1;font-size:6rem">${p.image_emoji || '📍'}</span>`}
        ${imgs.length ? '<div class="hero-zoom-hint">🔍</div>' : ''}
      </div>`;
  }
  // Multiple images — main + thumbnail strip
  return `
    <div class="detail-gallery">
      <div class="gallery-main" onclick="openGalleryLightbox(${window._galleryIndex||0})">
        <img id="galleryMainImg" src="${imgs[0]}" alt="${p.name}" loading="eager"
          onerror="this.style.display='none'">
        <div class="gallery-count">📸 ${imgs.length} ຮູບ</div>
        <div class="hero-zoom-hint">🔍</div>
      </div>
      <div class="gallery-strip">
        ${imgs.map((url, i) => `
          <div class="gallery-thumb ${i===0?'active':''}" onclick="switchGallery(${i})" data-idx="${i}">
            <img src="${url}" alt="photo ${i+1}" loading="lazy" onerror="this.parentElement.style.display='none'">
          </div>`).join('')}
      </div>
    </div>`;
}

// ── SWITCH GALLERY THUMBNAIL ──
window._galleryImgs = [];
window._galleryIndex = 0;
function switchGallery(idx) {
  window._galleryIndex = idx;
  const main = document.getElementById('galleryMainImg');
  if (main) {
    main.style.opacity = '0';
    setTimeout(() => {
      main.src = window._galleryImgs[idx];
      main.style.opacity = '1';
    }, 150);
  }
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.toggle('active', parseInt(t.dataset.idx)===idx));
}

// ── GALLERY LIGHTBOX ──
function openGalleryLightbox(startIdx) {
  const imgs = window._galleryImgs;
  if (!imgs.length) return;
  let idx = startIdx;

  let lb = document.getElementById('galleryLightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'galleryLightbox';
    lb.className = 'gallery-lightbox';
    lb.innerHTML = `
      <div class="glb-overlay" onclick="closeGalleryLightbox()"></div>
      <div class="glb-content">
        <img id="glbImg" src="" alt="">
        <button class="glb-close" onclick="closeGalleryLightbox()">✕</button>
        <button class="glb-prev" onclick="glbNav(-1)">‹</button>
        <button class="glb-next" onclick="glbNav(1)">›</button>
        <div class="glb-counter" id="glbCounter"></div>
      </div>`;
    document.body.appendChild(lb);
  }
  function update() {
    document.getElementById('glbImg').src = imgs[idx];
    document.getElementById('glbCounter').textContent = `${idx+1} / ${imgs.length}`;
  }
  window.glbNav = (dir) => { idx = (idx + dir + imgs.length) % imgs.length; update(); };
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  update();
}
function closeGalleryLightbox() {
  const lb = document.getElementById('galleryLightbox');
  if (lb) lb.style.display = 'none';
  document.body.style.overflow = '';
}
// Keyboard nav
document.addEventListener('keydown', e => {
  if (document.getElementById('galleryLightbox')?.style.display === 'flex') {
    if (e.key === 'ArrowLeft') window.glbNav?.(-1);
    if (e.key === 'ArrowRight') window.glbNav?.(1);
    if (e.key === 'Escape') closeGalleryLightbox();
  }
});

// ── RENDER DETAIL ──
function renderDetail(p) {
  const catLabel = getCatLabel(p.category);
  const mapSrc   = `https://maps.google.com/maps?q=${p.lat},${p.lng}&z=15&output=embed`;

  // Build gallery images array
  const imgs = [];
  if (p.image_url) imgs.push(p.image_url);
  if (p.gallery && Array.isArray(p.gallery)) imgs.push(...p.gallery);
  window._galleryImgs  = imgs;
  window._galleryIndex = 0;

  document.getElementById("detailContent").innerHTML = `
    <div class="container">
      ${renderGallery(p)}
      <div class="detail-layout">
        <!-- LEFT -->
        <div class="detail-left">
          <div class="detail-badge-row">
            <span class="detail-cat">${catLabel}</span>
            ${p.is_eco ? '<span class="detail-eco">🌱 Eco Friendly</span>' : ''}
            ${p.price_range ? `<span class="detail-price-badge">${p.price_range}</span>` : ''}
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
            ${p.view_count ? `
            <div class="info-item">
              <div class="info-label">👁️ ຍອດເບິ່ງ</div>
              <div class="info-value">${p.view_count.toLocaleString()} ຄັ້ງ</div>
            </div>` : ''}
            ${p.tags ? `
            <div class="info-item" style="grid-column:1/-1">
              <div class="info-label">🏷️ Tags</div>
              <div class="info-value" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end">
                ${(Array.isArray(p.tags) ? p.tags : p.tags.split(',')).map(t => `<span style="font-size:0.75rem;font-weight:600;color:var(--green-700);background:var(--green-100);border:1px solid var(--green-300);padding:2px 10px;border-radius:99px;">${t.trim()}</span>`).join('')}
              </div>
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
            <a href="https://maps.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}"
               target="_blank" class="nav-to-btn">🗺️ ນຳທາງໄປທີ່ນີ້</a>
          </div>

          <div class="sidebar-card">
            <h4>🤖 ${t("detail.ask_ai")}</h4>
            <p style="font-size:0.85rem;color:var(--muted);margin-bottom:16px;line-height:1.6">
              ${t("detail.ai_desc", { name: p.name })}
            </p>
            <a href="ai-chat.html?place=${encodeURIComponent(p.name)}" class="ai-suggest-btn">
              🤖 ${t("detail.ai_btn")}
            </a>
            <button id="bmBtn"
              onclick="toggleSave(window._currentPlace); const s=isSaved(window._currentPlace.id); this.textContent=s?'🔖 ບັນທຶກແລ້ວ':'🔖 ບັນທຶກສະຖານທີ່ນີ້'; this.style.background=s?'var(--green-700)':'var(--green-100)'; this.style.color=s?'#fff':'var(--green-700)'; if(typeof showToast!=='undefined') showToast(s?'🔖 ບັນທຶກແລ້ວ!':'🗑️ ລຶບອອກແລ້ວ');"
              style="display:block;width:100%;padding:13px;margin-top:12px;
                background:${isSaved(p.id)?'var(--green-700)':'var(--green-100)'};
                color:${isSaved(p.id)?'#fff':'var(--green-700)'};
                border:1.5px solid var(--green-300);border-radius:var(--radius-md);
                font-size:0.9rem;font-weight:600;font-family:var(--font-body);
                text-align:center;cursor:pointer;transition:var(--transition);">
              ${isSaved(p.id) ? '🔖 ບັນທຶກແລ້ວ' : '🔖 ບັນທຶກສະຖານທີ່ນີ້'}
            </button>
          </div>

          <div class="sidebar-card">
            <h4>🎫 ຈອງ / ນັດໝາຍ</h4>
            <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">
              ${p.category === 'activity' || p.category === 'attraction' ? `
              <button onclick="openBooking('activity', ${p.id}, '${p.name.replace(/'/g,"\\'")}' )"
                style="padding:12px;background:linear-gradient(135deg,#1050a0,#1a6bbf);color:#fff;
                border:none;border-radius:10px;font-size:0.9rem;font-weight:700;font-family:inherit;cursor:pointer;">
                🏔️ ຈອງກິດຈະກຳ
              </button>` : ''}
              ${p.category === 'hotel' ? `
              <button onclick="openBooking('hotel', ${p.id}, '${p.name.replace(/'/g,"\\'")}' )"
                style="padding:12px;background:linear-gradient(135deg,#1050a0,#1a6bbf);color:#fff;
                border:none;border-radius:10px;font-size:0.9rem;font-weight:700;font-family:inherit;cursor:pointer;">
                🏨 ຈອງທີ່ພັກ
              </button>` : ''}
              ${p.phone ? `<a href="tel:${p.phone}" class="contact-btn phone-btn">📞 ໂທຫາ ${p.phone}</a>` : ''}
              ${p.whatsapp ? `<a href="https://wa.me/${p.whatsapp.replace(/[^0-9]/g,'')}" target="_blank" class="contact-btn wa-btn">💬 WhatsApp</a>` : ''}
            </div>
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
  `;
}

// ── SHARE ──
function sharePlace(method) {
  const p   = window._currentPlace;
  if (!p) return;
  const base = 'https://duantest001-rgb.github.io/vangvieng-explorer';
  const url  = `${base}/pages/detail.html?id=${p.id}`;
  const enc  = encodeURIComponent(url);
  const etxt = encodeURIComponent(`🌿 ${p.name} — VangVieng Explorer\n${url}`);

  if (method === 'copy') {
    navigator.clipboard.writeText(url).then(() => showToast('📋 ຄັດລອກ URL ແລ້ວ!', 'success'));
  } else if (method === 'native' && navigator.share) {
    navigator.share({ title: p.name, text: `ສະຖານທີ່ທ່ຽວວັງວຽງ — ${p.name}`, url }).catch(()=>{});
  } else if (method === 'native') {
    navigator.clipboard.writeText(url).then(() => showToast('📋 ຄັດລອກ URL ແລ້ວ!', 'success'));
  } else if (method === 'facebook') {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${enc}`, '_blank', 'width=600,height=400');
  } else if (method === 'line') {
    window.open(`https://social-plugins.line.me/lineit/share?url=${enc}`, '_blank', 'width=600,height=400');
  } else if (method === 'whatsapp') {
    window.open(`https://wa.me/?text=${etxt}`, '_blank');
  }
}

// ── VIEW COUNTER ──
async function incrementView(id) {
  try {
    const key = `vve_viewed_${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_view`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ place_id: id })
    });
  } catch {}
}

function showError(msg) {
  document.getElementById("detailContent").innerHTML = `
    <div class="container" style="text-align:center;padding:80px 0">
      <div style="font-size:3rem;margin-bottom:16px">⚠️</div>
      <h3>${msg}</h3>
      <a href="explore.html" style="display:inline-block;margin-top:20px;color:var(--green-600);font-weight:600">← ${t("detail.back")}</a>
    </div>`;
}

function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      hamburger.classList.toggle("active", open);
    });
    navLinks.querySelectorAll(".nav-link").forEach(l =>
      l.addEventListener("click", () => { navLinks.classList.remove("open"); hamburger.classList.remove("active"); })
    );
    document.addEventListener("click", e => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove("open"); hamburger.classList.remove("active");
      }
    });
  }
  updateNavBadge?.();
}
