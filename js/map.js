/* ═══════════════════════════════════════════════
   Map Page Logic — v2
═══════════════════════════════════════════════ */

let allPlaces = [];
let activeId  = null;
let catFilter = "";

const CAT_LABEL = {
  attraction: "ສະຖານທີ່", hotel: "ທີ່ພັກ",
  restaurant: "ຮ້ານອາຫານ", activity: "ກິດຈະກຳ"
};

document.addEventListener("DOMContentLoaded", async () => {
  setupNavbar();
  setupTabs();
  await loadPlaces();
});

// ── LOAD ──
async function loadPlaces() {
  const list = document.getElementById("mapPlaceList");
  // Skeleton loading
  list.innerHTML = Array(5).fill(`
    <div style="display:flex;gap:0;border:1.5px solid var(--border);border-radius:12px;margin-bottom:10px;overflow:hidden;">
      <div class="loading-card" style="width:80px;height:80px;flex-shrink:0;border-radius:0;"></div>
      <div style="flex:1;padding:12px;display:flex;flex-direction:column;gap:6px;">
        <div class="loading-card" style="height:12px;width:45%;border-radius:6px;"></div>
        <div class="loading-card" style="height:14px;width:75%;border-radius:6px;"></div>
        <div class="loading-card" style="height:11px;width:55%;border-radius:6px;"></div>
      </div>
    </div>`).join("");

  try {
    allPlaces = await db.getPlaces();
    renderList(allPlaces);
  } catch {
    list.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--muted);">
        <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
        <p>ໂຫລດຜິດພາດ</p>
        <button onclick="loadPlaces()" style="margin-top:12px;padding:8px 20px;border-radius:99px;background:var(--green-700);color:#fff;border:none;font-family:inherit;cursor:pointer;">🔄 ລອງໃໝ່</button>
      </div>`;
  }
}

// ── RENDER CARD LIST ──
function renderList(places) {
  const list = document.getElementById("mapPlaceList");
  if (!places.length) {
    list.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--muted);">
        <div style="font-size:2.5rem;margin-bottom:12px;">🔍</div>
        <p>ບໍ່ພົບສະຖານທີ່</p>
      </div>`;
    return;
  }

  list.innerHTML = places.map((p, i) => {
    const tags = p.tags ? p.tags.split(',').slice(0,2).map(t =>
      `<span class="map-item-tag">${t.trim()}</span>`).join('') : '';
    const imgContent = p.image_url
      ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy"
           style="opacity:0;transition:opacity 0.3s ease;"
           onload="this.style.opacity='1'" onerror="this.style.display='none'">`
      : (p.image_emoji || '📍');
    return `
      <div class="map-place-item${activeId === p.id ? ' active' : ''}"
           onclick="selectPlace(${p.id}, ${p.lat}, ${p.lng}, this)"
           style="animation: cardReveal 0.4s ease ${i * 0.04}s both;"
           role="button" tabindex="0"
           aria-label="${p.name}">
        <div class="map-item-thumb" style="background:${p.image_bg || '#e0f2ff'};">
          ${imgContent}
          ${p.is_eco ? '<span class="map-item-eco">🌱 ECO</span>' : ''}
        </div>
        <div class="map-item-info">
          <div class="map-item-cat">${CAT_LABEL[p.category] || p.category}</div>
          <div class="map-item-name">${p.name}</div>
          <div class="map-item-sub">${p.address || ''}</div>
          ${tags ? `<div class="map-item-tags">${tags}</div>` : ''}
        </div>
        ${p.rating ? `<div class="map-item-rating">⭐ ${p.rating}</div>` : ''}
      </div>`;
  }).join("");
}

// ── SELECT PLACE ──
function selectPlace(id, lat, lng, el) {
  activeId = id;
  const place = allPlaces.find(p => p.id === id);

  // Update map
  const map = document.getElementById("mainMap");
  if (lat && lng) {
    map.src = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  }

  // Update active style
  document.querySelectorAll(".map-place-item").forEach(e => e.classList.remove("active"));
  el.classList.add("active");

  // Scroll item into view smoothly
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Show floating info panel
  showSelectedPanel(place);
}

// ── FLOATING PANEL ──
function showSelectedPanel(place) {
  let panel = document.getElementById("mapSelectedPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "mapSelectedPanel";
    panel.className = "map-selected-panel";
    document.querySelector(".map-container").appendChild(panel);
  }
  panel.classList.remove("hidden");

  const imgContent = place.image_url
    ? `<img src="${place.image_url}" alt="${place.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
    : (place.image_emoji || '📍');

  const mapsUrl = place.lat && place.lng
    ? `https://maps.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
    : `https://maps.google.com/maps/search/${encodeURIComponent(place.name + ' Vang Vieng')}`;

  panel.innerHTML = `
    <div class="sel-thumb" style="background:${place.image_bg || '#e0f2ff'};">${imgContent}</div>
    <div class="sel-info">
      <div class="sel-name">${place.name}</div>
      <div class="sel-sub">${place.address || ''} ${place.rating ? '· ⭐ ' + place.rating : ''}</div>
      <div class="sel-actions">
        <a href="detail.html?id=${place.id}" class="sel-btn">📋 ລາຍລະອຽດ</a>
        <a href="${mapsUrl}" target="_blank" class="sel-btn">🗺️ ນຳທາງ</a>
      </div>
    </div>
    <button class="sel-close" onclick="closePanel()" title="ປິດ">✕</button>`;
}

function closePanel() {
  document.getElementById("mapSelectedPanel")?.classList.add("hidden");
  document.querySelectorAll(".map-place-item").forEach(e => e.classList.remove("active"));
  activeId = null;
}

// ── FILTER TABS ──
function setupTabs() {
  document.querySelectorAll(".map-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".map-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      catFilter = tab.dataset.cat;
      const filtered = catFilter ? allPlaces.filter(p => p.category === catFilter) : allPlaces;
      renderList(filtered);
    });
  });
}

// ── NAVBAR ──
function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      hamburger.classList.toggle("active", open);
    });
    navLinks.querySelectorAll(".nav-link").forEach(l =>
      l.addEventListener("click", () => {
        navLinks.classList.remove("open");
        hamburger.classList.remove("active");
      })
    );
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove("open");
        hamburger.classList.remove("active");
      }
    });
  }
}

// Inject cardReveal keyframe if not already present
if (!document.querySelector('#mapRevealStyle')) {
  const s = document.createElement('style');
  s.id = 'mapRevealStyle';
  s.textContent = `
    @keyframes cardReveal {
      from { opacity:0; transform:translateY(14px); }
      to   { opacity:1; transform:translateY(0); }
    }`;
  document.head.appendChild(s);
}
