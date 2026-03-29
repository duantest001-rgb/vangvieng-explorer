/* ═══════════════════════════════════════════════
   Explore Page Logic — v2
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
  setupBackToTop();
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
      <div class="error-state" style="grid-column:1/-1;">
        <div class="error-icon">⚠️</div>
        <p>ເຊື່ອມຕໍ່ຖານຂໍ້ມູນຜິດພາດ</p>
        <button class="retry-btn" onclick="loadPlaces()">🔄 ລອງໃໝ່</button>
      </div>`;
  }
}

// ── APPLY FILTERS + SORT ──
function applyFilters() {
  // Flash count updating
  const countEl = document.getElementById("resultsCount");
  countEl?.classList.add("updating");

  let result = [...state.allPlaces];

  if (state.category) result = result.filter(p => p.category === state.category);
  if (state.eco)      result = result.filter(p => p.is_eco === true);
  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.name_en?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.tags?.toLowerCase().includes(q)
    );
  }

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

  // Animate count
  setTimeout(() => {
    updateCount(result.length);
    countEl?.classList.remove("updating");
    countEl?.classList.remove("count-pop");
    void countEl?.offsetWidth; // reflow
    countEl?.classList.add("count-pop");
  }, 80);
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

  grid.innerHTML = places.map((p, idx) => {
    const imgContent = p.image_url
      ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy"
           style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.4s ease;"
           onload="this.style.opacity='1'" onerror="this.style.display='none'">`
      : (p.image_emoji || '📍');

    const delay = Math.min(idx * 0.05, 0.5);
    return `
    <div class="place-card" role="button" tabindex="0" aria-label="${p.name}"
         style="animation-delay:${delay}s"
         onclick="window.location.href='detail.html?id=${p.id}'"
         onkeydown="if(event.key==='Enter')window.location.href='detail.html?id=${p.id}'">
      <div style="position:relative; overflow:hidden;">
        <div style="background:${p.image_bg || '#e0f2ff'}; width:100%; aspect-ratio:3/2;
          display:flex; align-items:center; justify-content:center; font-size:4rem;
          position:relative; overflow:hidden;">
          ${imgContent}
          <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.35) 100%);z-index:1;pointer-events:none;"></div>
        </div>
        ${p.is_eco ? '<span class="card-eco-badge">🌱 Eco</span>' : ''}
        <span class="card-rating-badge">⭐ ${p.rating || '-'}</span>
        <button
          class="card-bm-btn${isSaved(p.id) ? ' bm-on' : ''}"
          aria-label="${isSaved(p.id) ? 'ລຶບທີ່ບັນທຶກ' : 'ບັນທຶກສະຖານທີ່'}"
          onclick="event.stopPropagation(); toggleSave(${JSON.stringify(p).replace(/"/g,'&quot;')}); this.classList.toggle('bm-on'); this.textContent=isSaved('${p.id}')?'🔖':'➕'"
        >${isSaved(p.id) ? '🔖' : '➕'}</button>
      </div>
      <div class="card-body">
        <span class="card-cat">${getCatLabel(p.category)}</span>
        <h3 class="card-title">${p.name}</h3>
        ${p.tags ? `<div class="card-tags">${p.tags.split(',').slice(0,3).map(t => `<span class="card-tag">${t.trim()}</span>`).join('')}</div>` : ''}
        <div class="card-footer">
          <span class="card-price">${p.price_range || ''}</span>
          <span style="font-size:0.75rem;color:var(--muted)">${p.address || ''}</span>
        </div>
      </div>
    </div>`;
  }).join("");
}

// ── SHOW LOADING ──
function showLoading(grid) {
  grid.innerHTML = Array(8).fill('<div class="loading-card"></div>').join("");
}

// ── UPDATE COUNT ──
function updateCount(n) {
  const lang = localStorage.getItem("lang") || "lo";
  const tr = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[lang]) || {};
  const label = tr["results.count"]
    ? tr["results.count"].replace("{n}", n)
    : `ພົບ ${n} ສະຖານທີ່`;
  document.getElementById("resultsCount").textContent = label;
}

// ── CATEGORY FILTER ──
function setupFilters() {
  document.querySelectorAll(".filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      if (tab.dataset.eco) {
        state.eco = !state.eco;
        tab.classList.toggle("active", state.eco);
      } else {
        document.querySelectorAll(".filter-tab:not(.eco-tab)").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        state.category = tab.dataset.cat;
      }
      applyFilters();
    });
  });
}

// ── SEARCH — debounced ──
function setupSearch() {
  const input = document.getElementById("exploreSearch");
  const clearBtn = document.getElementById("clearSearch");
  let timer;
  input.addEventListener("input", () => {
    state.search = input.value.trim();
    clearBtn.style.display = state.search ? "block" : "none";
    clearTimeout(timer);
    timer = setTimeout(applyFilters, 280);
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

// ── NAVBAR — with X animation ──
function setupNavbar() {
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      hamburger.classList.toggle("active", isOpen);
    });
    navLinks.querySelectorAll(".nav-link").forEach(l => l.addEventListener("click", () => {
      navLinks.classList.remove("open");
      hamburger.classList.remove("active");
    }));
    document.addEventListener("click", e => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove("open");
        hamburger.classList.remove("active");
      }
    });
  }
  updateNavBadge();

  // scroll shadow on sticky filter bar
  window.addEventListener("scroll", () => {
    const fs = document.querySelector(".filters-section");
    if (fs) fs.style.boxShadow = window.scrollY > 120
      ? "0 4px 24px rgba(16,80,160,0.12)"
      : "0 4px 24px rgba(16,80,160,0.08)";
  });
}

// ── BACK TO TOP ──
function setupBackToTop() {
  const btt = document.createElement("button");
  btt.id = "backToTop";
  btt.className = "back-to-top";
  btt.innerHTML = "↑";
  btt.setAttribute("aria-label", "ກັບຂຶ້ນເທິງ");
  btt.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  document.body.appendChild(btt);
  window.addEventListener("scroll", () => {
    btt.classList.toggle("visible", window.scrollY > 400);
  });
}

// ── HELPERS ──
function t(key) {
  const lang = localStorage.getItem("lang") || "lo";
  return (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
}
function getCatLabel(cat) {
  const map = { attraction: "cat.attraction", hotel: "cat.hotel", restaurant: "cat.restaurant", activity: "cat.activity" };
  return map[cat] ? t(map[cat]) : cat;
}

