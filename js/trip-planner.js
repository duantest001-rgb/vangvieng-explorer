/* ═══════════════════════════════════════════════
   Trip Planner — VangVieng Explorer
   Uses: Supabase places + Cloudflare Worker (Claude API)
═══════════════════════════════════════════════ */

const WORKER_URL = "https://gemini-proxy.duan-test001.workers.dev";

// ── TAB SWITCHING ──
function switchChatTab(tab) {
  document.getElementById('sectionChat').classList.toggle('active', tab === 'chat');
  document.getElementById('sectionPlanner').classList.toggle('active', tab === 'planner');
  document.getElementById('tabChat').classList.toggle('active', tab === 'chat');
  document.getElementById('tabPlanner').classList.toggle('active', tab === 'planner');
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

  html += `<div class="plan-pace-note">${paceMsg[meta.pace] ?? ''}</div>`;
  document.getElementById('plannerResult').innerHTML = html;
}

// ── RESET ──
function resetPlanner() {
  document.getElementById('plannerForm').style.display = 'block';
  document.getElementById('plannerResult').style.display = 'none';
  document.getElementById('plannerResult').innerHTML = '';
}
