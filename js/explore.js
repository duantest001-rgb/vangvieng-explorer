/* ═══════════════════════════════════════════════
   Explore Page Logic
═══════════════════════════════════════════════ */

// ── STATE ──
let state = {
  category: "",
  eco: false,
  search: "",
  sort: "rating",
  allPlaces: [],
  filtered: []
};

// ── INIT ──
document.addEventListener("DOMContentLoaded", async () => {
  setupNavbar();
  setupSearch();
  setupFilters();
  readURLParams();
  await loadPlaces();
});

// ── READ URL PARAMS ──
function readURLParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("q"))   state.search   = params.get("q");
  if (params.get("cat")) state.category = params.get("cat");
  if (params.get("eco")) state.eco      = true;

  if (state.search) {
    document.getElementById("exploreSearch").value = state.search;
    document.getElementById("clearSearch").style.display = "block";
  }
  if (state.category) {
    document.querySelectorAll(".filter-tab").forEach(t => {
      t.classList.toggle("active", t.dataset.cat === state.category);
    });
  }
  if (state.eco) {
    document.querySelectorAll(".filter-tab").forEach(t => {
      if (t.dataset.eco) t.classList.add("active");
    });
  }
}

// ── LOAD FROM SUPABASE ──
async function loadPlaces() {
  const grid = document.getElementById("exploreGrid");
  showLoading(grid);

  try {
    const data = await db.getPlaces();
    state.allPlaces = data;
    applyFilters();
  } catch (err) {
    grid.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p data-i18n="error.db">ເຊື່ອມຕໍ່ຖານຂໍ້ມູນຜິດພາດ</p>
        <button class="retry-btn" onclick="loadPlaces()" data-i18n="error.retry">ລອງໃໝ່</button>
      </div>`;
  }
}

// ── APPLY FILTERS + SORT ──
function applyFilters() {
  let result = [...state.allPlaces];

  // Category
  if (state.category) {
    result = result.filter(p => p.category === state.category);
  }
  // Eco
  if (state.eco) {
    result = result.filter(p => p.is_eco === true);
  }
  // Search
  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.name_en?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    );
  }
  // Sort
  if (state.sort === "rating") {
    result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (state.sort === "name") {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.sort === "price_asc") {
    const priceVal = p => (p.price_range || "$").length;
    result.sort((a, b) => priceVal(a) - priceVal(b));
  }

  state.filtered = result;
  renderGrid(result);
  updateCount(result.length);
}

// ── RENDER GRID ──
function renderGrid(places) {
  const grid = document.getElementById("exploreGrid");

  if (places.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-icon">🔍</div>
        <h3 data-i18n="results.empty.title">ບໍ່ພົບສະຖານທີ່</h3>
        <p data-i18n="results.empty.sub">ລອງປ່ຽນ filter ຫຼື ຄຳຄົ້ນຫາ</p>
      </div>`;
    return;
  }

  grid.innerHTML = places.map(p => `
    <div class="place-card" onclick="window.location.href='detail.html?id=${p.id}'">
      <div style="position:relative">
        <div style="background:${p.image_bg || '#e0f2ff'}; width:100%; aspect-ratio:3/2;
          display:flex; align-items:center; justify-content:center; font-size:4rem;
          position:relative; overflow:hidden;">
          ${p.image_url
            ? `<img src="${p.image_url}" alt="${p.name}"
                style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"
                onerror="this.style.display='none'">`
            : p.image_emoji || '📍'
          }
          <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.3) 100%)"></div>
        </div>
        ${p.is_eco ? '<span class="card-eco-badge">🌱 Eco</span>' : ''}
        <span class="card-rating-badge">⭐ ${p.rating || '-'}</span>
        <button
          class="card-bm-btn${isSaved(p.id) ? ' bm-on' : ''}"
          onclick="event.stopPropagation(); toggleSave(${JSON.stringify(p).replace(/"/g,'&quot;')}); this.classList.toggle('bm-on'); this.textContent=isSaved('${p.id}')?'🔖':'➕'"
          title="ບັນທຶກ"
        >${isSaved(p.id) ? '🔖' : '➕'}</button>
      </div>
      <div class="card-body">
        <span class="card-cat">${getCatLabel(p.category)}</span>
        <h3 class="card-title">${p.name}</h3>
        <div class="card-footer">
          <span class="card-price">${p.price_range || ''}</span>
          <span style="font-size:0.75rem;color:var(--muted)">${p.address || ''}</span>
        </div>
      </div>
    </div>
  `).join("");
}

// ── SHOW LOADING ──
function showLoading(grid) {
  grid.innerHTML = Array(8).fill('<div class="loading-card"></div>').join("");
}

// ── UPDATE COUNT ──
function updateCount(n) {
  const lang = localStorage.getItem("lang") || "lo";
  const tr = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[lang]) || {};
  const label = tr["results.count"] ? tr["results.count"].replace("{n}", n) : `ພົບ ${n} ສະຖານທີ່`;
  document.getElementById("resultsCount").textContent = label;
}

// ── CATEGORY FILTER ──
function setupFilters() {
  document.querySelectorAll(".filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      if (tab.dataset.eco) {
        // Eco toggle
        state.eco = !state.eco;
        tab.classList.toggle("active", state.eco);
      } else {
        // Category
        document.querySelectorAll(".filter-tab:not(.eco-tab)").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        state.category = tab.dataset.cat;
      }
      applyFilters();
    });
  });
}

// ── SEARCH ──
function setupSearch() {
  const input = document.getElementById("exploreSearch");
  const clearBtn = document.getElementById("clearSearch");
  let timer;

  input.addEventListener("input", () => {
    state.search = input.value.trim();
    clearBtn.style.display = state.search ? "block" : "none";
    clearTimeout(timer);
    timer = setTimeout(applyFilters, 300);
  });
}

function clearSearch() {
  document.getElementById("exploreSearch").value = "";
  document.getElementById("clearSearch").style.display = "none";
  state.search = "";
  applyFilters();
}

// ── SORT ──
function handleSort() {
  state.sort = document.getElementById("sortSelect").value;
  applyFilters();
}

// ── NAVBAR ──
function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => navLinks.classList.toggle("open"));
    navLinks.querySelectorAll(".nav-link").forEach(l =>
      l.addEventListener("click", () => navLinks.classList.remove("open"))
    );
  }
  updateNavBadge();
}

// ── HELPER ──
function t(key) {
  const lang = localStorage.getItem("lang") || "lo";
  return (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
}
function getCatLabel(cat) {
  const map = { attraction: "cat.attraction", hotel: "cat.hotel", restaurant: "cat.restaurant", activity: "cat.activity" };
  return map[cat] ? t(map[cat]) : cat;
}
