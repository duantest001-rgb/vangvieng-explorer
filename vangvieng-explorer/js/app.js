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

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.stat-num').forEach(el => {
        const target = parseInt(el.dataset.target);
        animateCounter(el, target);
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

// ── RENDER FEATURED PLACES ──
function getCategoryLabel(cat) {
  const labels = {
    attraction: 'ສະຖານທີ່',
    hotel: 'ທີ່ພັກ',
    restaurant: 'ຮ້ານອາຫານ',
    activity: 'ກິດຈະກຳ'
  };
  return labels[cat] || cat;
}

function renderPlaceCard(place) {
  return `
    <div class="place-card" onclick="goToDetail(${place.id})">
      <div class="card-img-placeholder" style="background:${place.image_bg}; width:100%; aspect-ratio:4/3; display:flex; align-items:center; justify-content:center; font-size:3.5rem;">
        ${place.image_emoji}
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="card-cat">${getCategoryLabel(place.category)}</span>
          ${place.is_eco ? '<span class="card-eco">🌱 Eco</span>' : ''}
        </div>
        <h3 class="card-title">${place.name}</h3>
        <p class="card-desc">${place.description}</p>
        <div class="card-footer">
          <span class="card-rating">⭐ ${place.rating}</span>
          <span class="card-price">${place.price_range} · ${place.address}</span>
        </div>
      </div>
    </div>
  `;
}

function renderFeatured() {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;

  grid.innerHTML = Array(6).fill('<div class="loading-card"></div>').join("");

  db.getPlaces().then(data => {
    const featured = data.slice(0, 6);
    if (featured.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🌿</div><h3>ຍັງບໍ່ມີຂໍ້ມູນ</h3></div>`;
      return;
    }
    grid.innerHTML = featured.map(renderPlaceCard).join("");
  }).catch(() => {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>ໂຫລດຂໍ້ມູນຜິດພາດ</h3></div>`;
  });
}

function goToDetail(id) {
  window.location.href = `pages/detail.html?id=${id}`;
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
});
