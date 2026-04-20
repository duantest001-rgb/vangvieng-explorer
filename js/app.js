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
    tags: "ທ່ອງທ່ຽວ,ນ້ຳ,ຖ້ຳ"
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
    tags: "ນ້ຳ,ທ່ອງທ່ຽວ"
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
    tags: "resort,pool,view"
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
    tags: "ອາຫານລາວ,local,ລາຄາຖືກ"
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
    tags: "adventure,ນ້ຳ,kayak"
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
    tags: "cafe,coffee,breakfast"
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
  // Back-to-top visibility
  const btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('visible', window.scrollY > 400);
});

// ── HAMBURGER MENU — with X animation ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
  });
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    });
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
    }
  });
}

// ── SEARCH with debounce ──
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

// ── TOAST ──
function showToast(msg, type = 'info', duration = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ── STATS COUNTER ──
function animateCounter(el, target, duration = 1600) {
  let start = 0;
  const startTime = performance.now();
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    el.textContent = Math.floor(easeOut(progress) * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}

// ── RENDER PLACE CARD ──
function t(key) {
  const lang = localStorage.getItem("lang") || "lo";
  return (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
}
function getCategoryLabel(cat) {
  const map = { attraction: "cat.attraction", hotel: "cat.hotel", restaurant: "cat.restaurant", activity: "cat.activity" };
  return map[cat] ? t(map[cat]) : cat;
}

function renderPlaceCard(place) {
  const imgContent = place.image_url
    ? `<img src="${place.image_url}" alt="${place.name}" loading="lazy"
         style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.4s ease;"
         onload="this.style.opacity='1'" onerror="this.style.display='none'">`
    : place.image_emoji || '📍';
  return `
    <div class="place-card" onclick="goToDetail(${place.id})" role="button" tabindex="0"
         aria-label="${place.name}" onkeydown="if(event.key==='Enter')goToDetail(${place.id})">
      <div style="position:relative; overflow:hidden;">
        <div class="card-img-placeholder" style="background:${place.image_bg || '#e0f2ff'};">
          ${imgContent}
          <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.35) 100%);z-index:1;pointer-events:none;"></div>
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

// ── LOAD STATS with retry ──
async function loadStats(retries = 2) {
  try {
    const data = await db.getPlaces();
    const total       = data.length;
    const hotels      = data.filter(p => p.category === 'hotel').length;
    const restaurants = data.filter(p => p.category === 'restaurant').length;
    const activities  = data.filter(p => p.category === 'activity').length;
    const targets = [total, hotels, restaurants, activities];
    const els = document.querySelectorAll('.stats-widget .stat-num');
    els.forEach((el, i) => {
      if (targets[i] !== undefined) {
        el.dataset.target = targets[i];
        animateCounter(el, targets[i]);
      }
    });
  } catch (err) {
    if (retries > 0) {
      setTimeout(() => loadStats(retries - 1), 2000);
    }
    console.error("Stats error:", err);
  }
}

// ── RENDER FEATURED with retry ──
async function renderFeatured(retries = 2) {
  const grid = document.getElementById("featuredGrid");
  if (!grid) return;
  grid.innerHTML = Array(6).fill('<div class="loading-card"></div>').join("");
  try {
    const data = await db.getPlaces();
    const featured = data.slice(0, 6);
    if (featured.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🌿</div><h3>ຍັງບໍ່ມີຂໍ້ມູນ</h3></div>`;
      return;
    }
    grid.innerHTML = featured.map(renderPlaceCard).join("");
  } catch (err) {
    if (retries > 0) {
      setTimeout(() => renderFeatured(retries - 1), 2000);
    } else {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">⚠️</div>
          <h3>ໂຫລດຂໍ້ມູນຜິດພາດ</h3>
          <p style="margin-top:8px;font-size:0.85rem;color:var(--muted);">
            <button onclick="renderFeatured()" style="background:var(--green-700);color:#fff;border:none;padding:8px 20px;border-radius:20px;cursor:pointer;font-size:0.85rem;">🔄 ລອງໃໝ່</button>
          </p>
        </div>`;
    }
  }
}

function goToDetail(id) {
  window.location.href = `pages/detail.html?id=${id}`;
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  loadStats();

  // Back-to-top button
  const btt = document.createElement('button');
  btt.id = 'backToTop';
  btt.className = 'back-to-top';
  btt.innerHTML = '↑';
  btt.setAttribute('aria-label', 'ກັບຂຶ້ນເທິງ');
  btt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btt);
});
// ==========================================
// ລະບົບ Event Slider (ດຶງຂໍ້ມູນຈາກ Supabase)
// ==========================================
let slideIndex = 1;
let slideInterval;

async function loadEventSliders() {
  const container = document.getElementById('sliderContainer');
  // ຖ້າບໍ່ມີກ່ອງນີ້ໃນໜ້າເວັບ (ເຊັ່ນຢູ່ໜ້າອື່ນ) ໃຫ້ຂ້າມການເຮັດວຽກໄປເລີຍ ເພື່ອບໍ່ໃຫ້ເກີດ Error
  if (!container) return; 
  
  try {
    // ດຶງຂໍ້ມູນຈາກ Supabase (ສະເພາະ Event ທີ່ເປີດໃຊ້ງານ: is_active = true)
    const { data: events, error } = await supabase
      .from('event_sliders')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (events.length === 0) {
      container.innerHTML = '<p style="text-align:center;">ຍັງບໍ່ມີກິດຈະກຳໃນຕອນນີ້</p>';
      return;
    }

    // ສ້າງ HTML ຈາກຂໍ້ມູນທີ່ດຶງມາ
    let htmlContent = '';
    events.forEach(event => {
      htmlContent += `
        <div class="event-slide fade">
          <img src="${event.image_url}" alt="${event.title}" style="width:100%; border-radius: 12px; height: 400px; object-fit: cover;">
          <div class="event-text">
            <h3>${event.title}</h3>
            <p>${event.description}</p>
          </div>
        </div>
      `;
    });

    // ໃສ່ປຸ່ມກົດ ຊ້າຍ-ຂວາ ຖ້າມີຫຼາຍກວ່າ 1 ຮູບ
    if (events.length > 1) {
      htmlContent += `
        <a class="prev-btn" onclick="changeSlide(-1)">&#10094;</a>
        <a class="next-btn" onclick="changeSlide(1)">&#10095;</a>
      `;
    }

    // ເອົາ HTML ໄປຍັດໃສ່ໃນໜ້າເວັບ
    container.innerHTML = htmlContent;

    // ເອີ້ນໃຊ້ຟັງຊັນໃຫ້ Slider ເລີ່ມເຮັດວຽກ
    slideIndex = 1;
    showSlides(slideIndex);
    if (events.length > 1) {
      startAutoSlide();
    }

  } catch (err) {
    console.error("Error loading sliders:", err);
    container.innerHTML = '<p style="text-align:center;">ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນ</p>';
  }
}

// ຟັງຊັນສຳລັບປຸ່ມກົດ ຊ້າຍ-ຂວາ (ໃຊ້ window. ເພື່ອໃຫ້ HTML ເອີ້ນໃຊ້ໄດ້ງ່າຍ)
window.changeSlide = function(n) {
  showSlides(slideIndex += n);
  resetAutoSlide(); 
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("event-slide");
  if (slides.length === 0) return; 
  
  if (n > slides.length) {slideIndex = 1}    
  if (n < 1) {slideIndex = slides.length}
  
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slides[slideIndex-1].style.display = "block";  
}

function startAutoSlide() {
  slideInterval = setInterval(function() {
    changeSlide(1);
  }, 5000); // ປ່ຽນຮູບທຸກໆ 5 ວິນາທີ
}

function resetAutoSlide() {
  clearInterval(slideInterval);
  startAutoSlide();
}

// ໃຫ້ລະບົບເລີ່ມດຶງຂໍ້ມູນທັນທີ ເມື່ອໜ້າເວັບໂຫຼດສຳເລັດ
document.addEventListener('DOMContentLoaded', () => {
  loadEventSliders();
});
// ==========================================
