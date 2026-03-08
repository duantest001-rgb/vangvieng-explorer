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
        <p>ເຊື່ອມຕໍ່ຖານຂໍ້ມູນຜິດພາດ</p>
        <button class="retry-btn" onclick="loadPlaces()">ລອງໃໝ່</button>
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
        <h3>ບໍ່ພົບສະຖານທີ່</h3>
        <p>ລອງປ່ຽນ filter ຫຼື ຄຳຄົ້ນຫາ</p>
      </div>`;
    return;
  }

  grid.innerHTML = places.map(p => `
    <div class="place-card" onclick="window.location.href='detail.html?id=${p.id}'">
      <div style="background:${p.image_bg || '#e0f2ff'}; width:100%; aspect-ratio:4/3;
        display:flex; align-items:center; justify-content:center; font-size:3.5rem;">
        ${p.image_emoji || "📍"}
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-cat">${getCatLabel(p.category)}</span>
          ${p.is_eco ? '<span class="card-eco">🌱 Eco</span>' : ''}
        </div>
        <h3 class="card-title">${p.name}</h3>
        <p class="card-desc">${p.description || ""}</p>
        <div class="card-footer">
          <span class="card-rating">⭐ ${p.rating || "-"}</span>
          <span class="card-price">${p.price_range || ""} · ${p.address || ""}</span>
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
  document.getElementById("resultsCount").textContent =
    `ພົບ ${n} ສະຖານທີ່`;
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
}

// ── HELPER ──
function getCatLabel(cat) {
  return { attraction: "ສະຖານທີ່", hotel: "ທີ່ພັກ", restaurant: "ຮ້ານອາຫານ", activity: "ກິດຈະກຳ" }[cat] || cat;
}
