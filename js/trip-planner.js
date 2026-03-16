/* ═══════════════════════════════════════════════
   Trip Planner — VangVieng Explorer
   Uses: Supabase places + Cloudflare Worker (Claude API)
═══════════════════════════════════════════════ */

const WORKER_URL = "https://gemini-proxy.duan-test001.workers.dev";

// ── TAB SWITCHING ──
function switchChatTab(tab) {
  ['chat','planner','saved'].forEach(t => {
    document.getElementById('section' + t.charAt(0).toUpperCase() + t.slice(1))?.classList.toggle('active', t === tab);
    document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1))?.classList.toggle('active', t === tab);
  });
  if (tab === 'saved') loadSavedPlans();
}

// ── TAG/CHIP HELPERS ──
function togglePTag(el) { el.classList.toggle('on'); }
function pickPChip(gid, el) {
  document.querySelectorAll(`#${gid} .p-chip`).forEach(c => c.classList.remove('on'));
  el.classList.add('on');
}

// ── GENERATE PLAN ──
async function generatePlan() {
  const days      = parseInt(document.getElementById('pDays').value);
  const interests = [...document.querySelectorAll('#pInterests .p-tag.on')].map(t => t.textContent.trim());
  const style     = document.querySelector('#pStyle .p-chip.on')?.textContent.trim() ?? 'Budget';
  const pace      = document.querySelector('#pPace .p-chip.on')?.textContent.trim() ?? '⚖️ ປານກາງ';

  if (!interests.length) {
    document.getElementById('plannerError').innerHTML =
      `<p style="color:#c0392b;font-size:0.85rem;margin-top:8px;">⚠️ ກະລຸນາເລືອກຄວາມສົນໃຈຢ່າງໜ້ອຍ 1 ຢ່າງ</p>`;
    return;
  }
  document.getElementById('plannerError').innerHTML = '';

  // Show loading
  document.getElementById('plannerForm').style.display = 'none';
  document.getElementById('plannerResult').style.display = 'block';
  document.getElementById('plannerResult').innerHTML = `
    <div style="text-align:center; padding:3rem 1rem;">
      <div class="planner-spinner"></div>
      <p style="margin-top:1rem; color:var(--muted); font-size:0.9rem;">AI ກຳລັງວາງແຜນ...</p>
    </div>`;

  try {
    // 1. ດຶງ places ຈາກ Supabase
    const places = await db.getPlaces();

    // 2. Build prompt
    const placesText = places.map((p, i) =>
      `${i+1}. ${p.name} | ປະເພດ: ${p.category} | rating: ${p.rating ?? 'N/A'}${p.tags ? ' | tags: '+p.tags : ''}`
    ).join('\n');

    const prompt = `ເຈົ້າຄືຜູ້ຊ່ວຍວາງແຜນທ່ຽວວັງວຽງ ລາວ.

ຂໍ້ມູນ tourist:
- ຢູ່ ${days} ວັນ
- ສົນໃຈ: ${interests.join(', ')}
- ລະດັບ: ${style}
- Pace: ${pace}

ສະຖານທີ່ທີ່ມີໃນ app:
${placesText}

ສ້າງ itinerary ໂດຍໃຊ້ສະຖານທີ່ຈາກລາຍການຂ້າງເທິງເທົ່ານັ້ນ
ຕອບເປັນ JSON array ເທົ່ານັ້ນ — ບໍ່ຕ້ອງມີ markdown ຫຼື backtick

format:
[
  {
    "day": 1,
    "label": "ຫົວຂໍ້ວັນ (ລາວ)",
    "stops": [
      {
        "time": "08:00",
        "place_name": "ຊື່ຄືກັນກັບລາຍການ",
        "note": "ຄຳແນະນຳສັ້ນໆ (ລາວ)"
      }
    ]
  }
]

ກົດ: ${pace === '🌿 ສະບາຍໆ' ? 'ສູງສຸດ 2 stops/ວັນ' : pace === '🔥 ເຕັມທີ່' ? '4-5 stops/ວັນ' : '3 stops/ວັນ'}`;

    // 3. Call Claude via Worker
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'ເຈົ້າຕອບໄດ້ສະເພາະ JSON array ເທົ່ານັ້ນ ບໍ່ມີ text ອື່ນ',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const itinerary = JSON.parse(clean);

    renderPlanResult(itinerary, places, { days, interests, style, pace });

  } catch (e) {
    document.getElementById('plannerResult').innerHTML = `
      <button class="planner-back-btn" onclick="resetPlanner()">← ກັບຄືນ</button>
      <div style="background:#fff3f3;border:1px solid #ffd0d0;border-radius:var(--radius-md);padding:1rem;font-size:0.85rem;color:#c62828;">
        ❌ ເກີດຂໍ້ຜິດພາດ: ${e.message}
      </div>`;
  }
}

// ── RENDER RESULT ──
function renderPlanResult(itinerary, places, meta) {
  const paceMsg = {
    '🌿 ສະບາຍໆ': '🌿 ແຜນຈັດແບບ relaxed — ບໍ່ຫຍຸ້ງ',
    '⚖️ ປານກາງ': '⚖️ ແຜນຈັດແບບປານກາງ — ສົມດຸນ',
    '🔥 ເຕັມທີ່': '🔥 ແຜນ pack ເຕັມ — ໄດ້ເຫັນຫຼາຍ'
  };

  let html = `
    <button class="planner-back-btn" onclick="resetPlanner()">← ວາງແຜນໃໝ່</button>
    <div class="plan-header">
      <div class="plan-title">ແຜນ ${meta.days} ວັນ ວັງວຽງ</div>
      <div class="plan-meta">
        <span class="plan-badge">${meta.style}</span>
        <span class="plan-badge">${meta.pace}</span>
      </div>
    </div>`;

  itinerary.forEach(day => {
    html += `<div class="plan-day"><div class="plan-day-label">ວັນທີ ${day.day} — ${day.label}</div>`;
    day.stops.forEach(stop => {
      const place = places.find(p => p.name?.toLowerCase() === stop.place_name?.toLowerCase());
      const thumb = place?.image_url
        ? `<img src="${place.image_url}" alt="" style="width:52px;height:52px;border-radius:var(--radius-sm);object-fit:cover;flex-shrink:0;" onerror="this.outerHTML='<div style=width:52px;height:52px;border-radius:8px;background:var(--green-100);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0>📍</div>'">`
        : `<div style="width:52px;height:52px;border-radius:var(--radius-sm);background:var(--green-100);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">${place?.image_emoji || '📍'}</div>`;

      html += `
        <div class="plan-stop" onclick="window.location.href='detail.html?id=${place?.id || ''}'">
          <div class="plan-time">${stop.time}</div>
          ${thumb}
          <div class="plan-info">
            <div class="plan-name">${stop.place_name}</div>
            ${place?.category ? `<span class="plan-cat">${place.category}</span>` : ''}
            <div class="plan-note">💡 ${stop.note}</div>
          </div>
          <div style="color:var(--border);font-size:1rem;padding-top:2px;flex-shrink:0;">›</div>
        </div>`;
    });
    html += `</div>`;
  });

  html += `
    <div class="plan-pace-note">${paceMsg[meta.pace] ?? ''}</div>
    <button class="planner-btn" style="margin-top:1rem;" onclick="savePlan()">
      💾 ບັນທຶກແຜນນີ້
    </button>
    <div id="saveStatus"></div>`;

  document.getElementById('plannerResult').innerHTML = html;
  // store current plan for saving
  window._currentPlan = { itinerary, places, meta };
}

// ── RESET ──
function resetPlanner() {
  document.getElementById('plannerForm').style.display = 'block';
  document.getElementById('plannerResult').style.display = 'none';
  document.getElementById('plannerResult').innerHTML = '';
  window._currentPlan = null;
}

// ── SAVE PLAN TO SUPABASE ──
async function savePlan() {
  const plan = window._currentPlan;
  if (!plan) return;
  const btn = document.querySelector('#plannerResult .planner-btn');
  if (btn) { btn.textContent = '⏳ ກຳລັງບັນທຶກ...'; btn.disabled = true; }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/saved_plans`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        plan_data: plan.itinerary,
        meta: plan.meta
      })
    });
    if (res.ok) {
      document.getElementById('saveStatus').innerHTML =
        `<p style="color:var(--green-700);font-size:0.85rem;text-align:center;margin-top:8px;">✅ ບັນທຶກແຜນສຳເລັດ!</p>`;
      if (btn) { btn.textContent = '✅ ບັນທຶກແລ້ວ'; btn.disabled = true; }
    } else {
      throw new Error('Save failed');
    }
  } catch (e) {
    document.getElementById('saveStatus').innerHTML =
      `<p style="color:#c0392b;font-size:0.85rem;text-align:center;margin-top:8px;">❌ ບັນທຶກຜິດພາດ</p>`;
    if (btn) { btn.textContent = '💾 ບັນທຶກແຜນນີ້'; btn.disabled = false; }
  }
}

// ── LOAD SAVED PLANS ──
async function loadSavedPlans() {
  const container = document.getElementById('savedPlansContainer');
  if (!container) return;
  container.innerHTML = `<div style="text-align:center;padding:2rem;"><div class="planner-spinner"></div></div>`;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/saved_plans?select=*&order=created_at.desc`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const plans = await res.json();
    renderSavedPlans(plans);
  } catch (e) {
    container.innerHTML = `<p style="color:#c0392b;font-size:0.85rem;text-align:center;">❌ ໂຫລດຜິດພາດ</p>`;
  }
}

// ── RENDER SAVED PLANS LIST ──
function renderSavedPlans(plans) {
  const container = document.getElementById('savedPlansContainer');
  if (!plans.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;">
        <div style="font-size:2.5rem;margin-bottom:12px;">🗺️</div>
        <p style="color:var(--muted);font-size:0.9rem;">ຍັງບໍ່ມີແຜນທ່ຽວທີ່ບັນທຶກ<br>ໄປ Trip Planner ແລ້ວກົດ 💾 ບັນທຶກ</p>
      </div>`;
    return;
  }

  container.innerHTML = plans.map(p => {
    const meta = p.meta || {};
    const days = meta.days || '?';
    const date = new Date(p.created_at).toLocaleDateString('lo-LA', { day:'numeric', month:'short' });
    const stops = (p.plan_data || []).reduce((s, d) => s + (d.stops?.length || 0), 0);
    return `
      <div class="saved-plan-card" onclick="openSavedPlan(${p.id})">
        <div class="saved-plan-info">
          <div class="saved-plan-title">ແຜນ ${days} ວັນ ວັງວຽງ</div>
          <div class="saved-plan-meta">${meta.style || ''} · ${meta.pace || ''} · ${stops} stops</div>
          <div class="saved-plan-date">📅 ${date}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button class="saved-plan-view">ເບິ່ງ →</button>
          <button class="saved-plan-del" onclick="event.stopPropagation();deleteSavedPlan(${p.id})">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

// ── OPEN SAVED PLAN ──
async function openSavedPlan(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/saved_plans?id=eq.${id}&select=*`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  const plan = data[0];
  if (!plan) return;
  const places = await db.getPlaces();
  switchChatTab('planner');
  document.getElementById('plannerForm').style.display = 'none';
  document.getElementById('plannerResult').style.display = 'block';
  renderPlanResult(plan.plan_data, places, plan.meta || {});
}

// ── DELETE SAVED PLAN ──
async function deleteSavedPlan(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/saved_plans?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  loadSavedPlans();
}
