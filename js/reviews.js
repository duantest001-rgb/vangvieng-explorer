/* ═══════════════════════════════════════════════
   Reviews Logic v2 — with photo upload
   Table: reviews (place_id, rating, comment, photo_url, approved)
═══════════════════════════════════════════════ */

const SUPA_URL = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '';
const SUPA_KEY = typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : '';
const CLOUDINARY_CLOUD = 'dkqnugtmg'; // ← ໃສ່ cloud name ຂອງເຈົ້າ
const CLOUDINARY_PRESET = 'vve_reviews'; // ← unsigned upload preset

// ── UPLOAD PHOTO TO CLOUDINARY ──
async function uploadReviewPhoto(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', 'vve_reviews');
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
      method: 'POST', body: fd
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.secure_url || null;
  } catch { return null; }
}

// ── SUBMIT REVIEW ──
async function submitReview(placeId, rating, comment = '', photoUrl = '') {
  if (!rating || rating < 1 || rating > 5) return false;
  try {
    const body = { place_id: placeId, rating, approved: false };
    if (comment.trim()) body.comment = comment.trim();
    if (photoUrl) body.photo_url = photoUrl;
    const res = await fetch(`${SUPA_URL}/rest/v1/reviews`, {
      method: 'POST',
      headers: {
        'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json', 'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch { return false; }
}

// ── LOAD APPROVED REVIEWS ──
async function loadReviews(placeId) {
  try {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/reviews?place_id=eq.${placeId}&approved=eq.true&select=rating,comment,photo_url,created_at&order=created_at.desc&limit=20`,
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

  const reviews   = await loadReviews(placeId);
  const avg       = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const ratedKey  = `vve_rated_${placeId}`;
  const alreadyRated = sessionStorage.getItem(ratedKey);

  // Rating breakdown
  const breakdown = [5,4,3,2,1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    const pct   = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, pct };
  });

  container.innerHTML = `
    <div class="review-section">
      <!-- Header -->
      <div class="review-header">
        <h4 class="review-title">⭐ ຄະແນນຈາກຜູ້ໃຊ້</h4>
        ${avg ? `
          <div class="review-avg">
            <span class="avg-num">${avg}</span>
            <div>
              <span class="avg-stars">${renderStars(parseFloat(avg))}</span><br>
              <span class="avg-count">${reviews.length} ຄຳຕິຊົມ</span>
            </div>
          </div>` : `<div class="review-avg-empty">ຍັງບໍ່ມີຄະແນນ</div>`
        }
      </div>

      <!-- Rating breakdown bars -->
      ${reviews.length ? `
        <div class="rating-breakdown">
          ${breakdown.map(b => `
            <div class="rb-row">
              <span class="rb-star">${b.star}★</span>
              <div class="rb-bar-wrap"><div class="rb-bar" style="width:${b.pct}%"></div></div>
              <span class="rb-count">${b.count}</span>
            </div>`).join('')}
        </div>` : ''}

      <!-- Submit form -->
      ${alreadyRated
        ? `<div class="review-done">✅ ເຈົ້າໃຫ້ຄະແນນ ${alreadyRated} ດາວແລ້ວ — ຂອບໃຈ!</div>`
        : `<div class="review-form" id="reviewForm_${placeId}">
             <p class="review-prompt">ເຈົ້າຄິດວ່າສະຖານທີ່ນີ້ເປັນແນວໃດ?</p>
             <div class="star-picker" id="starPicker">
               ${[1,2,3,4,5].map(i =>
                 `<button class="star-btn" data-val="${i}" onclick="hoverStar(${i})" onmouseleave="resetStarHover()" onclick="pickStar(${i}, ${placeId}, '${ratedKey}')">☆</button>`
               ).join('')}
             </div>
             <div class="review-fields" id="reviewFields_${placeId}" style="display:none;">
               <textarea id="reviewComment_${placeId}" class="review-comment"
                 placeholder="ຄຳຄິດເຫັນ (ບໍ່ບັງຄັບ)..." rows="3" maxlength="300"></textarea>
               <div class="review-photo-row">
                 <label class="review-photo-label" for="reviewPhoto_${placeId}">
                   📸 ຕິດຮູບ (ບໍ່ບັງຄັບ)
                 </label>
                 <input type="file" id="reviewPhoto_${placeId}" accept="image/*" style="display:none"
                   onchange="previewPhoto(this, ${placeId})">
                 <div id="photoPreview_${placeId}" class="photo-preview-wrap"></div>
               </div>
               <button class="review-submit-btn" id="reviewSubmitBtn_${placeId}"
                 onclick="submitReviewFull(${placeId}, '${ratedKey}')">
                 ✅ ສົ່ງຄຳຕິຊົມ
               </button>
             </div>
             <p class="review-note">* ຄຳຕິຊົມຈະສະແດງຫຼັງ admin ກວດສອບ</p>
           </div>`
      }

      <!-- Review list -->
      ${reviews.length ? `
        <div class="review-list">
          <div class="review-list-header">ຄຳຕິຊົມຫຼ້າສຸດ</div>
          ${reviews.slice(0,5).map(r => `
            <div class="review-item">
              <div class="review-item-top">
                <span class="review-item-stars">${renderStars(r.rating)} <span class="ri-num">${r.rating}.0</span></span>
                <span class="review-item-date">${formatDate(r.created_at)}</span>
              </div>
              ${r.comment ? `<p class="review-item-comment">${escHtml(r.comment)}</p>` : ''}
              ${r.photo_url ? `
                <div class="review-item-photo" onclick="openLightbox('${r.photo_url}')">
                  <img src="${r.photo_url}" alt="review photo" loading="lazy">
                  <div class="rip-overlay">🔍</div>
                </div>` : ''}
            </div>`).join('')}
        </div>` : ''}
    </div>

    <!-- Lightbox -->
    <div class="rv-lightbox" id="rvLightbox" onclick="closeLightbox()">
      <img id="rvLightboxImg" src="" alt="">
      <button class="rv-lb-close" onclick="closeLightbox()">✕</button>
    </div>
  `;

  // Setup file input click on label
  const label = container.querySelector(`label[for="reviewPhoto_${placeId}"]`);
  if (label) label.addEventListener('click', () => {
    container.querySelector(`#reviewPhoto_${placeId}`)?.click();
  });
}

// ── STAR HOVER ──
let _selectedStar = 0;
function hoverStar(val) {
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.textContent = parseInt(btn.dataset.val) <= val ? '★' : '☆';
  });
}
function resetStarHover() {
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.textContent = parseInt(btn.dataset.val) <= _selectedStar ? '★' : '☆';
  });
}

// ── PICK STAR ──
function pickStar(val, placeId, ratedKey) {
  _selectedStar = val;
  document.querySelectorAll('.star-btn').forEach(btn => {
    const v = parseInt(btn.dataset.val);
    btn.textContent = v <= val ? '★' : '☆';
    btn.classList.toggle('active', v <= val);
    // replace onclick to point to submitReviewFull
    btn.onclick = () => { pickStar(v, placeId, ratedKey); };
  });
  // Show comment/photo fields
  const fields = document.getElementById(`reviewFields_${placeId}`);
  if (fields) {
    fields.style.display = 'block';
    fields.style.animation = 'fadeSlideIn 0.3s ease';
  }
}

// ── PREVIEW PHOTO ──
function previewPhoto(input, placeId) {
  const file = input.files[0];
  if (!file) return;
  const wrap = document.getElementById(`photoPreview_${placeId}`);
  if (!wrap) return;
  const reader = new FileReader();
  reader.onload = e => {
    wrap.innerHTML = `
      <div class="photo-preview">
        <img src="${e.target.result}" alt="preview">
        <button class="photo-remove-btn" onclick="removePhoto(${placeId})">✕</button>
      </div>`;
  };
  reader.readAsDataURL(file);
}

function removePhoto(placeId) {
  const input = document.getElementById(`reviewPhoto_${placeId}`);
  const wrap  = document.getElementById(`photoPreview_${placeId}`);
  if (input) input.value = '';
  if (wrap)  wrap.innerHTML = '';
}

// ── SUBMIT FULL REVIEW ──
async function submitReviewFull(placeId, ratedKey) {
  // ✅ ຕ້ອງ login ກ່ອນ submit review
  const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
  if (!session) {
    showLoginRequiredPopup('ຂຽນ Review');
    return;
  }

  const btn     = document.getElementById(`reviewSubmitBtn_${placeId}`);
  const comment = document.getElementById(`reviewComment_${placeId}`)?.value || '';
  const fileInput = document.getElementById(`reviewPhoto_${placeId}`);
  const file    = fileInput?.files[0];
  const rating  = _selectedStar;

  if (!rating) { showToast('⭐ ກະລຸນາເລືອກດາວກ່ອນ', 'error'); return; }

  // Loading state
  if (btn) { btn.textContent = '⏳ ກຳລັງສົ່ງ...'; btn.disabled = true; }

  // Upload photo if any
  let photoUrl = '';
  if (file) {
    showToast('📸 ກຳລັງ upload ຮູບ...', 'info');
    photoUrl = await uploadReviewPhoto(file) || '';
  }

  const ok = await submitReview(placeId, rating, comment, photoUrl);

  if (ok) {
    sessionStorage.setItem(ratedKey, rating);
    const form = document.getElementById(`reviewForm_${placeId}`);
    if (form) {
      form.innerHTML = `
        <div class="review-done">
          ✅ ຂອບໃຈສຳລັບຄຳຕິຊົມ ${rating} ດາວ!<br>
          <span style="font-size:0.8rem;color:var(--muted);">ຈະສະແດງຫຼັງ admin ກວດສອບ</span>
        </div>`;
    }
    showToast('✅ ສົ່ງຄຳຕິຊົມສຳເລັດ!', 'success');
  } else {
    if (btn) { btn.textContent = '✅ ສົ່ງຄຳຕິຊົມ'; btn.disabled = false; }
    showToast('❌ ເກີດຂໍ້ຜິດພາດ ລອງໃໝ່', 'error');
  }
}

// ── LIGHTBOX ──
function openLightbox(url) {
  const lb  = document.getElementById('rvLightbox');
  const img = document.getElementById('rvLightboxImg');
  if (!lb || !img) return;
  img.src = url;
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const lb = document.getElementById('rvLightbox');
  if (lb) lb.style.display = 'none';
  document.body.style.overflow = '';
}

// ── HELPERS ──
function renderStars(avg) {
  return [1,2,3,4,5].map(i =>
    i <= Math.floor(avg) ? '★' : (i - avg < 1 && avg % 1 >= 0.5 ? '★' : '☆')
  ).join('');
}
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
}
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// showToast — fallback if not defined globally
if (typeof showToast === 'undefined') {
  window.showToast = function(msg, type = 'info', duration = 3000) {
    let c = document.getElementById('toastContainer');
    if (!c) { c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = `toast ${type}`; t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('toast-out'); t.addEventListener('animationend', () => t.remove(), {once:true}); }, duration);
  };
}
