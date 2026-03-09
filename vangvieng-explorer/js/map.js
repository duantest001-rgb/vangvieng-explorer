/* ═══════════════════════════════════════════════
   Map Page Logic
═══════════════════════════════════════════════ */

let allPlaces = [];
let activeId  = null;
let catFilter = "";

document.addEventListener("DOMContentLoaded", async () => {
  setupNavbar();
  setupTabs();
  await loadPlaces();
});

async function loadPlaces() {
  const list = document.getElementById("mapPlaceList");
  list.innerHTML = Array(6).fill(`
    <div style="display:flex;gap:12px;padding:12px;margin-bottom:6px">
      <div class="loading-card" style="width:48px;height:48px;border-radius:12px;flex-shrink:0"></div>
      <div style="flex:1">
        <div class="loading-card" style="height:14px;width:70%;margin-bottom:6px"></div>
        <div class="loading-card" style="height:12px;width:50%"></div>
      </div>
    </div>`).join("");

  try {
    allPlaces = await db.getPlaces();
    renderList(allPlaces);
  } catch {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">⚠️ ໂຫລດຜິດພາດ</div>`;
  }
}

function renderList(places) {
  const list = document.getElementById("mapPlaceList");
  if (!places.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted)">ບໍ່ພົບສະຖານທີ່</div>`;
    return;
  }
  list.innerHTML = places.map(p => `
    <div class="map-place-item ${activeId === p.id ? 'active' : ''}"
         onclick="selectPlace(${p.id}, ${p.lat}, ${p.lng})">
      <div class="map-item-icon" style="background:${p.image_bg || '#e0f2ff'}">
        ${p.image_emoji || "📍"}
      </div>
      <div class="map-item-info">
        <div class="map-item-name">${p.name}</div>
        <div class="map-item-sub">${p.address || ""}</div>
      </div>
      <div class="map-item-rating">⭐ ${p.rating || ""}</div>
    </div>
  `).join("");
}

function selectPlace(id, lat, lng) {
  activeId = id;
  // update map
  const map = document.getElementById("mainMap");
  map.src = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  // update active style
  document.querySelectorAll(".map-place-item").forEach(el => el.classList.remove("active"));
  event.currentTarget.classList.add("active");
}

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

function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => navLinks.classList.toggle("open"));
  }
}
