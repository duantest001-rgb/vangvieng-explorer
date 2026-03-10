/* ═══════════════════════════════════════════════
   VangVieng Explorer — app.js
   Phase 1: Static data (Phase 2 = Supabase)
═══════════════════════════════════════════════ */

// ── MOCK DATA (Phase 2 ຈະດຶງຈາກ Supabase ແທນ) ──
const PLACES_DATA = [
  {
    id: 1,
    name: "ຖ້ຳທາມ ພູຄາມ",
    name_en: "Tham Phu Kham Cave",
    category: "attraction",
    description: "ຖ້ຳທີ່ສວຍງາມ ພ້ອມ Blue Lagoon ທີ່ຮູ້ຈັກທົ່ວໂລກ ເໝາະສຳລັບລອຍນ້ຳ ແລະ ສຳຫຼວດ",
    address: "4km ຈາກຕົວເມືອງ",
    lat: 18.9167, lng: 102.4333,
    image_emoji: "🏔️",
    image_bg: "#d4eddf",
    price_range: "$",
    rating: 4.7,
    is_eco: true,
    tags: ["ທ່ອງທ່ຽວ", "ນ້ຳ", "ຖ້ຳ"]
  },
  {
    id: 2,
    name: "Blue Lagoon 2",
    name_en: "Blue Lagoon 2",
    category: "attraction",
    description: "ສະລອຍນ້ຳທຳມະຊາດທີ່ງຽບສະຫງົບ ນ້ຳສີຟ້າໃສ ບ່ອນທ່ຽວທີ່ຄົນຮູ້ຈັກໜ້ອຍກວ່າ",
    address: "7km ຈາກຕົວເມືອງ",
    lat: 18.9300, lng: 102.4500,
    image_emoji: "💙",
    image_bg: "#d8e8ff",
    price_range: "$",
    rating: 4.5,
    is_eco: true,
    tags: ["ນ້ຳ", "ທ່ອງທ່ຽວ"]
  },
  {
    id: 3,
    name: "ວ້ານ ວຽງ ວິວ ຣີສອດ",
    name_en: "Vang Vieng View Resort",
    category: "hotel",
    description: "ຣີສອດທີ່ສວຍງາມ ມອງເຫັນທ້ອງທົ່ງ ແລະ ພູ Nam Xay ພ້ອມ infinity pool",
    address: "ໃຈກາງຕົວເມືອງ",
    lat: 18.9228, lng: 102.4441,
    image_emoji: "🏨",
    image_bg: "#fdf0d0",
    price_range: "$$$",
    rating: 4.8,
    is_eco: false,
    tags: ["resort", "pool", "view"]
  },
  {
    id: 4,
    name: "ຮ້ານ ສ່ວງໃຈ",
    name_en: "Suang Jai Restaurant",
    category: "restaurant",
    description: "ອາຫານລາວແທ້ ລ້ວງຈາກສ່ວນຄົວທ້ອງຖິ່ນ ລາຄາໄມ່ແພງ ບ່ອນນັ່ງທ່ຽວຊິວ",
    address: "ຖະໜົນຫຼວງ, ໃຈກາງ",
    lat: 18.9215, lng: 102.4430,
    image_emoji: "🍜",
    image_bg: "#ffe0cc",
    price_range: "$",
    rating: 4.6,
    is_eco: false,
    tags: ["ອາຫານລາວ", "local", "ລາຄາຖືກ"]
  },
  {
    id: 5,
    name: "ລ້ອງຄາຍັກ ນາມຊອງ",
    name_en: "Nam Song Kayak",
    category: "activity",
    description: "ລ້ອງຄາຍັກໃນແມ່ນ້ຳ Nam Song ໄດ້ 2-4 ຊົ່ວໂມງ ຜ່ານທ້ອງທົ່ງ ແລະ ຖ້ຳ",
    address: "ທ່າ North ຂອງຕົວເມືອງ",
    lat: 18.9280, lng: 102.4420,
    image_emoji: "🛶",
    image_bg: "#d8e8ff",
    price_range: "$$",
    rating: 4.9,
    is_eco: true,
    tags: ["adventure", "ນ້ຳ", "kayak"]
  },
  {
    id: 6,
    name: "The Hive Cafe",
    name_en: "The Hive Cafe",
    category: "restaurant",
    description: "Specialty coffee ເກດດີ ແລະ ຂອງຫວານ ບ່ອນນັ່ງຮ່ອງໆ ຕິດ balcony ມອງແມ່ນ້ຳ",
    address: "ຖະໜົນ Luang Prabang",
    lat: 18.9220, lng: 102.4445,
    image_emoji: "☕",
    image_bg: "#fdf0d0",
    price_range: "$$",
    rating: 4.5,
    is_eco: false,
    tags: ["cafe", "coffee", "breakfast"]
  }
];

// ── NAVBAR SCROLL ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ── HAMBURGER MENU ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ── SEARCH ──
function handleSearch() {
  const query = document.getElementById('heroSearch')?.value?.trim();
  if (query) {
    window.location.href = `pages/explore.html?q=${encodeURIComponent(query)}`;
  }
}
function searchTag(tag) {
  window.location.href = `pages/explore.html?q=${encodeURIComponent(tag)}`;
}
document.getElementById('heroSearch')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// ── STATS COUNTER ──
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target; clearInterval(timer); return; }
    el.textContent = Math.floor(start);
  }, 16);
}

// ── RENDER FEATURED PLACES ──
function t(key) {
  const lang = localStorage.getItem("lang") || "lo";
  return (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
}
function getCategoryLabel(cat) {
  const map = { attraction: "cat.attraction", hotel: "cat.hotel", restaurant: "cat.restaurant", activity: "cat.activity" };
  return map[cat] ? t(map[cat]) : cat;
}

function renderPlaceCard(place) {
  return `
    <div class="place-card" onclick="goToDetail(${place.id})">
      <div style="position:relative">
        <div class="card-img-placeholder" style="background:${place.image_bg || '#e0f2ff'}; width:100%; aspect-ratio:3/2; display:flex; align-items:center; justify-content:center; font-size:4rem; position:relative; overflow:hidden;">
          ${place.image_url
            ? `<img src="${place.image_url}" alt="${place.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
            : place.image_emoji || '📍'
          }
          <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 50%,rgba(0,0,0,0.3) 100%)"></div>
        </div>
        ${place.is_eco ? '<span class="card-eco-badge">🌱 Eco</span>' : ''}
        <span class="card-rating-badge">⭐ ${place.rating || '-'}</span>
      </div>
      <div class="card-body">
        <span class="card-cat">${getCategoryLabel(place.category)}</span>
        <h3 class="card-title">${place.name}</h3>
        <div class="card-footer">
          <span class="card-price">${place.price_range || ''}</span>
          <span class="card-price" style="color:var(--muted);font-size:0.75rem">${place.address || ''}</span>
        </div>
      </div>
    </div>
  `;
}
async function loadStats() {
  try {
    const data = await db.getPlaces();
    const total       = data.length;
    const hotels      = data.filter(p => p.category === 'hotel').length;
    const restaurants = data.filter(p => p.category === 'restaurant').length;
    const activities  = data.filter(p => p.category === 'activity').length;

    const targets = [total, hotels, restaurants, activities];
    document.querySelectorAll('.stat-num').forEach((el, i) => {
      el.dataset.target = targets[i];
      animateCounter(el, targets[i]);
    });
  } catch (err) {
    console.error("Stats error:", err);
  }
}
function renderFeatured() {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;

  grid.innerHTML = Array(6).fill('<div class="loading-card"></div>').join("");

  db.getPlaces().then(data => {
    const featured = data.slice(0, 6);
    if (featured.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🌿</div><h3 data-i18n="results.empty.title">ຍັງບໍ່ມີຂໍ້ມູນ</h3></div>`;
      return;
    }
    grid.innerHTML = featured.map(renderPlaceCard).join("");
  }).catch(() => {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3 data-i18n="error.db">ໂຫລດຂໍ້ມູນຜິດພາດ</h3></div>`;
  });
}

function goToDetail(id) {
  window.location.href = `pages/detail.html?id=${id}`;
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  loadStats();
});
