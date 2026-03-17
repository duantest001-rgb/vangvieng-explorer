/* ═══════════════════════════════════════════════
   Active Trip — VangVieng Explorer
   ສະແດງ banner + popup track ການທ່ຽວ real-time
═══════════════════════════════════════════════ */

const TRIP_KEY = 'vve_active_trip';

// ── SAVE ACTIVE TRIP (ເອີ້ນຈາກ trip-planner) ──
function startActiveTrip(itinerary, places, meta) {
  const allStops = [];
  itinerary.forEach(day => {
    day.stops.forEach(stop => {
      const place = places.find(p => p.name?.toLowerCase() === stop.place_name?.toLowerCase());
      allStops.push({
        name: stop.place_name,
        time: stop.time,
        note: stop.note,
        day:  day.day,
        lat:  place?.lat || null,
        lng:  place?.lng || null,
        id:   place?.id  || null,
        done: false
      });
    });
  });

  localStorage.setItem(TRIP_KEY, JSON.stringify({
    meta,
    stops: allStops,
    startedAt: Date.now()
  }));

  renderActiveBanner();
}

function getActiveTrip() {
  try { return JSON.parse(localStorage.getItem(TRIP_KEY)); }
  catch { return null; }
}

function saveActiveTrip(trip) {
  localStorage.setItem(TRIP_KEY, JSON.stringify(trip));
}

function endTrip() {
  localStorage.removeItem(TRIP_KEY);
  document.getElementById('activeTripBanner')?.remove();
  document.getElementById('activeTripDrawer')?.remove();
}

// ── RENDER BANNER ──
function renderActiveBanner() {
  const trip = getActiveTrip();
  if (!trip) return;

  // ລຶບ banner ເກົ່າ
  document.getElementById('activeTripBanner')?.remove();

  const done  = trip.stops.filter(s => s.done).length;
  const total = trip.stops.length;
  const pct   = Math.round((done / total) * 100);
  const next  = trip.stops.find(s => !s.done);

  const banner = document.createElement('div');
  banner.id = 'activeTripBanner';
  banner.innerHTML = `
    <div class="atrip-banner" onclick="toggleTripDrawer()">
      <div class="atrip-left">
        <span class="atrip-icon">🗺️</span>
        <div class="atrip-info">
          <div class="atrip-title">ກຳລັງທ່ຽວ — ${trip.meta.days} ວັນ</div>
          <div class="atrip-sub">${next ? `ຕໍ່ໄປ: ${next.name}` : '✅ ຮອດທຸກຈຸດແລ້ວ!'}</div>
        </div>
      </div>
      <div class="atrip-right">
        <div class="atrip-progress">
          <div class="atrip-bar" style="width:${pct}%"></div>
        </div>
        <div class="atrip-count">${done}/${total}</div>
      </div>
    </div>
  `;
  document.body.prepend(banner);
}

// ── RENDER DRAWER ──
function renderTripDrawer() {
  const trip = getActiveTrip();
  if (!trip) return;

  document.getElementById('activeTripDrawer')?.remove();

  const drawer = document.createElement('div');
  drawer.id = 'activeTripDrawer';

  const stops = trip.stops.map((s, i) => {
    const isNext = !s.done && trip.stops.slice(0, i).every(x => x.done);
    let navUrl = '';
    if (s.lat && s.lng) {
      // ຖ້າ stop ກ່ອນໜ້າ tick ແລ້ວ ໃຊ້ directions
      const prev = trip.stops[i - 1];
      if (prev?.lat && prev?.lng) {
        navUrl = `https://maps.google.com/maps/dir/${prev.lat},${prev.lng}/${s.lat},${s.lng}`;
      } else {
        navUrl = `https://maps.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=driving`;
      }
    } else {
      navUrl = `https://maps.google.com/maps/search/${encodeURIComponent(s.name + ' Vang Vieng')}`;
    }

    return `
      <div class="atrip-stop ${s.done ? 'done' : ''} ${isNext ? 'is-next' : ''}">
        <button class="atrip-check" onclick="tripToggleStop(${i})">${s.done ? '✅' : '☐'}</button>
        <div class="atrip-stop-info">
          <div class="atrip-stop-name">${s.name}</div>
          <div class="atrip-stop-time">ວັນທີ ${s.day} · ${s.time}</div>
          ${isNext ? `<div class="atrip-next-label">📍 ຈຸດຕໍ່ໄປ</div>` : ''}
        </div>
        <a href="${navUrl}" target="_blank" class="atrip-nav ${isNext ? 'atrip-nav-active' : ''}">
          🗺️${isNext ? ' ນຳທາງ' : ''}
        </a>
      </div>`;
  }).join('');

  const done  = trip.stops.filter(s => s.done).length;
  const total = trip.stops.length;

  drawer.innerHTML = `
    <div class="atrip-overlay" onclick="toggleTripDrawer()"></div>
    <div class="atrip-sheet">
      <div class="atrip-sheet-handle"></div>
      <div class="atrip-sheet-header">
        <div>
          <div class="atrip-sheet-title">🗺️ ແຜນທ່ຽວຂອງຂ້ອຍ</div>
          <div class="atrip-sheet-sub">${done}/${total} ຈຸດ · ${trip.meta.days} ວັນ ${trip.meta.style}</div>
        </div>
        <button class="atrip-end-btn" onclick="confirmEndTrip()">ຈົບການທ່ຽວ</button>
      </div>
      <div class="atrip-stops">${stops}</div>
      ${done === total ? `
      <div class="atrip-complete">
        🎉 ທ່ຽວສຳເລັດທຸກຈຸດແລ້ວ!
        <button onclick="confirmEndTrip()" class="atrip-done-btn">ຈົບ ແລະ ປິດ</button>
      </div>` : ''}
    </div>
  `;
  document.body.appendChild(drawer);
  setTimeout(() => drawer.querySelector('.atrip-sheet').style.transform = 'translateY(0)', 10);
}

// ── TOGGLE DRAWER ──
function toggleTripDrawer() {
  const existing = document.getElementById('activeTripDrawer');
  if (existing) {
    existing.querySelector('.atrip-sheet').style.transform = 'translateY(100%)';
    setTimeout(() => existing.remove(), 300);
  } else {
    renderTripDrawer();
  }
}

// ── TOGGLE STOP ──
function tripToggleStop(idx) {
  const trip = getActiveTrip();
  if (!trip) return;
  trip.stops[idx].done = !trip.stops[idx].done;
  saveActiveTrip(trip);
  renderActiveBanner();
  renderTripDrawer(); // re-render drawer
}

// ── CONFIRM END ──
function confirmEndTrip() {
  if (confirm('ຈົບການທ່ຽວ ແລະ ລຶບແຜນນີ້ອອກ?')) {
    endTrip();
    document.getElementById('activeTripDrawer')?.remove();
  }
}

// ── CSS (inject) ──
(function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
  #activeTripBanner {
    position: fixed; top: 64px; left: 0; right: 0; z-index: 999;
  }
  .atrip-banner {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, var(--green-700, #0F6E56), var(--green-500, #2589e0));
    padding: 10px 16px; cursor: pointer; gap: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  }
  .atrip-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
  .atrip-icon { font-size: 1.3rem; flex-shrink: 0; }
  .atrip-title { font-size: 0.82rem; font-weight: 700; color: #fff; }
  .atrip-sub { font-size: 0.72rem; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .atrip-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .atrip-progress { width: 60px; height: 5px; background: rgba(255,255,255,0.25); border-radius: 99px; overflow: hidden; }
  .atrip-bar { height: 100%; background: #fff; border-radius: 99px; transition: width 0.4s; }
  .atrip-count { font-size: 0.75rem; font-weight: 700; color: #fff; white-space: nowrap; }

  /* DRAWER */
  #activeTripDrawer { position: fixed; inset: 0; z-index: 3000; }
  .atrip-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); }
  .atrip-sheet {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: #fff; border-radius: 20px 20px 0 0;
    max-height: 85vh; overflow-y: auto;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    padding: 0 0 2rem;
  }
  .atrip-sheet-handle {
    width: 40px; height: 4px; background: #e0e0e0;
    border-radius: 99px; margin: 12px auto 0;
  }
  .atrip-sheet-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 12px;
    padding: 16px 20px; border-bottom: 1px solid #f0f0f0;
  }
  .atrip-sheet-title { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
  .atrip-sheet-sub { font-size: 0.78rem; color: #888; margin-top: 2px; }
  .atrip-end-btn {
    padding: 7px 14px; border-radius: 99px;
    background: #fff0f0; color: #c0392b;
    border: 1px solid #ffc8c8;
    font-size: 0.78rem; font-weight: 600;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
    font-family: inherit;
  }
  .atrip-stops { padding: 8px 16px; }
  .atrip-stop {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 10px; border-radius: 12px;
    margin-bottom: 6px; transition: all 0.2s;
    border: 1px solid #f0f0f0;
  }
  .atrip-stop.done { opacity: 0.5; background: #f9f9f9; }
  .atrip-stop.is-next {
    border-color: #1D9E75; background: #f0fdf8;
    box-shadow: 0 2px 8px rgba(29,158,117,0.1);
  }
  .atrip-check {
    font-size: 1.1rem; background: none; border: none;
    cursor: pointer; flex-shrink: 0; font-family: inherit;
    transition: transform 0.1s;
  }
  .atrip-check:hover { transform: scale(1.2); }
  .atrip-stop-info { flex: 1; min-width: 0; }
  .atrip-stop-name { font-size: 0.9rem; font-weight: 700; color: #1a1a1a; }
  .atrip-stop-time { font-size: 0.72rem; color: #888; margin-top: 1px; }
  .atrip-next-label { font-size: 0.72rem; font-weight: 700; color: #1D9E75; margin-top: 2px; }
  .atrip-nav {
    font-size: 0.8rem; text-decoration: none;
    padding: 6px 10px; border-radius: 8px;
    background: #f0f0f0; flex-shrink: 0;
    transition: all 0.15s;
  }
  .atrip-nav-active {
    background: #1D9E75; color: #fff;
    font-weight: 600; padding: 7px 14px;
    border-radius: 99px;
  }
  .atrip-complete {
    text-align: center; padding: 20px 16px;
    font-size: 0.95rem; font-weight: 600; color: #1D9E75;
  }
  .atrip-done-btn {
    display: block; margin: 10px auto 0;
    padding: 10px 24px; border-radius: 99px;
    background: #1D9E75; color: #fff;
    border: none; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; font-family: inherit;
  }
  `;
  document.head.appendChild(s);
})();

// ── INIT on page load ──
document.addEventListener('DOMContentLoaded', () => {
  const trip = getActiveTrip();
  if (trip) {
    document.body.classList.add('has-active-trip');
    renderActiveBanner();
  }
});
