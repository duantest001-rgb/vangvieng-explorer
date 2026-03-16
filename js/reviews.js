/* ═══════════════════════════════════════════════
   Reviews Logic — VangVieng Explorer
   Table: reviews (place_id, rating, approved)
═══════════════════════════════════════════════ */

const SUPA_URL = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '';
const SUPA_KEY = typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : '';

// ── SUBMIT REVIEW ──
async function submitReview(placeId, rating) {
  if (!rating || rating < 1 || rating > 5) return false;
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/reviews`, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ place_id: placeId, rating, approved: false })
    });
    return res.ok;
  } catch { return false; }
}

// ── LOAD APPROVED REVIEWS ──
async function loadReviews(placeId) {
  try {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/reviews?place_id=eq.${placeId}&approved=eq.true&select=rating,created_at&order=created_at.desc`,
      { headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

// ── RENDER REVIEW SECTION ──
async function renderReviews(placeId, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const reviews = await loadReviews(placeId);
  const avg     = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // check if already rated this session
  const ratedKey = `vve_rated_${placeId}`;
  const alreadyRated = sessionStorage.getItem(ratedKey);

  container.innerHTML = `
    <div class="review-section">
      <div class="review-header">
        <h4 class="review-title">⭐ ຄະແນນຈາກຜູ້ໃຊ້</h4>
        ${avg
          ? `<div class="review-avg">
               <span class="avg-num">${avg}</span>
               <span class="avg-stars">${renderStars(parseFloat(avg))}</span>
               <span class="avg-count">(${reviews.length} ຄົນ)</span>
             </div>`
          : `<div class="review-avg-empty">ຍັງບໍ່ມີຄະແນນ</div>`
        }
      </div>

      ${alreadyRated
        ? `<div class="review-done">
             ✅ ເຈົ້າໃຫ້ຄະແນນ ${alreadyRated} ດາວແລ້ວ — ຂອບໃຈ!
           </div>`
        : `<div class="review-form">
             <p class="review-prompt">ເຈົ້າຄິດວ່າສະຖານທີ່ນີ້ເປັນແນວໃດ?</p>
             <div class="star-picker" id="starPicker">
               ${[1,2,3,4,5].map(i =>
                 `<button class="star-btn" data-val="${i}" onclick="pickStar(${i}, ${placeId}, '${ratedKey}')">☆</button>`
               ).join('')}
             </div>
             <p class="review-note">* ຄະແນນຈະສະແດງຫຼັງ admin ກວດສອບ</p>
           </div>`
      }
    </div>
  `;
}

// ── STAR PICKER INTERACTION ──
function pickStar(val, placeId, ratedKey) {
  // highlight stars
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.textContent = parseInt(btn.dataset.val) <= val ? '★' : '☆';
    btn.classList.toggle('active', parseInt(btn.dataset.val) <= val);
  });
  // confirm after short delay
  clearTimeout(window._starTimer);
  window._starTimer = setTimeout(() => confirmReview(val, placeId, ratedKey), 600);
}

async function confirmReview(rating, placeId, ratedKey) {
  const picker = document.getElementById('starPicker');
  if (picker) picker.style.pointerEvents = 'none';

  const ok = await submitReview(placeId, rating);
  if (ok) {
    sessionStorage.setItem(ratedKey, rating);
    const form = document.querySelector('.review-form');
    if (form) {
      form.innerHTML = `<div class="review-done">✅ ຂອບໃຈສຳລັບຄະແນນ ${rating} ດາວ!<br><span style="font-size:0.8rem;color:var(--muted)">ຈະສະແດງຫຼັງ admin ກວດສອບ</span></div>`;
    }
  } else {
    const form = document.querySelector('.review-form');
    if (form) {
      form.innerHTML += `<p style="color:#c0392b;font-size:0.82rem;margin-top:8px;">❌ ເກີດຂໍ້ຜິດພາດ ລອງໃໝ່</p>`;
      if (picker) picker.style.pointerEvents = 'auto';
    }
  }
}

// ── RENDER STARS (display only) ──
function renderStars(avg) {
  return [1,2,3,4,5].map(i => {
    if (i <= Math.floor(avg)) return '★';
    if (i - avg < 1 && avg % 1 >= 0.5) return '★';
    return '☆';
  }).join('');
}
