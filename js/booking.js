/* ═══════════════════════════════════════════════
   Booking System — VangVieng Explorer
   ຮອງຮັບ: activity, hotel, taxi, bike
═══════════════════════════════════════════════ */

// ── OPEN BOOKING MODAL ──
function openBooking(type, placeId = null, placeName = '') {
  // ຕ້ອງ login ກ່ອນ
  const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
  if (!session) {
    showLoginRequiredPopup('ຈອງ ' + getTypeLabel(type));
    return;
  }

  document.getElementById('bookingModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'bookingModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,24,48,0.7);z-index:9998;display:flex;align-items:flex-end;justify-content:center;padding:0;';

  modal.innerHTML = `
    <div id="bookingSheet" style="background:#fff;border-radius:24px 24px 0 0;padding:1.8rem 1.5rem 2rem;
      width:100%;max-width:480px;max-height:90vh;overflow-y:auto;
      animation:slideUpSheet .3s cubic-bezier(.16,1,.3,1);">

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">
        <h2 style="font-size:1.1rem;font-weight:700;color:#071830;">
          ${getTypeEmoji(type)} ຈອງ${getTypeLabel(type)}
          ${placeName ? '<span style="font-size:0.85rem;color:#6b7a99;font-weight:400;display:block;">' + placeName + '</span>' : ''}
        </h2>
        <button onclick="closeBooking()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#9aa5be;">✕</button>
      </div>

      <!-- Common Fields -->
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">👤 ${t('bk.name')} *</label>
          <input id="bk_name" type="text" placeholder="ຊື່ ນາມສະກຸນ"
            value="${session.name || ''}"
            style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
        </div>
        <div>
          <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">📱 ${t('bk.phone')} *</label>
          <input id="bk_phone" type="tel" placeholder="+856 20 xxxx xxxx"
            style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
        </div>
        <div>
          <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">📧 Email <span style="font-size:0.72rem;color:#9aa5be;font-weight:400;">(ສຳລັບຮັບໃບຢືນຢັນ)</span></label>
          <input id="bk_email" type="email" placeholder="example@email.com"
            value="${session.email || ''}"
            style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
        </div>
        <div>
          <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">📅 ${t('bk.date')} *</label>
          <input id="bk_date" type="date" min="${new Date().toISOString().slice(0,10)}"
            style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
        </div>
        <div>
          <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">👥 ${t('bk.persons')}</label>
          <input id="bk_persons" type="number" min="1" max="50" value="1"
            style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
        </div>

        ${getTypeFields(type)}

        <div>
          <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">📝 ${t('bk.notes')}</label>
          <textarea id="bk_notes" rows="2" placeholder="ຕ້ອງການພິເສດ, ຂໍ້ມູນເພີ່ມ..."
            style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;resize:none;"></textarea>
        </div>
      </div>

      <div id="bk_error" style="display:none;background:#ffdede;color:#c0392b;border-radius:9px;padding:9px 13px;font-size:0.82rem;margin-top:10px;font-weight:600;"></div>
      <div id="bk_success" style="display:none;background:#d4edda;color:#155724;border-radius:9px;padding:12px;font-size:0.88rem;margin-top:10px;text-align:center;"></div>

      <button id="bk_submit" onclick="submitBooking('${type}', ${placeId}, '${placeName.replace(/'/g,"\\'")}', '${session.userId}')"
        style="width:100%;padding:14px;background:linear-gradient(135deg,#1050a0,#1a6bbf);color:#fff;
        border:none;border-radius:12px;font-size:1rem;font-weight:700;font-family:inherit;
        cursor:pointer;margin-top:1rem;">
        ✅ ${t('bk.confirm')}
      </button>
    </div>
  `;

  modal.addEventListener('click', e => { if (e.target === modal) closeBooking(); });
  document.body.appendChild(modal);
}

// ── TYPE HELPERS ──
function getTypeLabel(type) {
  return { activity:t('bk.activity'), hotel:t('bk.hotel'), taxi:t('bk.taxi'), bike:t('bk.bike') }[type] || type;
}
function getTypeEmoji(type) {
  return { activity:'🏔️', hotel:'🏨', taxi:'🚕', bike:'🛵' }[type] || '📋';
}

function getTypeFields(type) {
  if (type === 'taxi') return `
    <div>
      <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">📍 ຈຸດຮັບ *</label>
      <input id="bk_pickup" type="text" placeholder="ໂຮງແຮມ / ສະໜາມບິນ / ..."
        style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
    </div>
    <div>
      <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">🏁 ຈຸດສົ່ງ *</label>
      <input id="bk_dropoff" type="text" placeholder="ຈຸດໝາຍ..."
        style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
    </div>
    <div>
      <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">🚗 ປະເພດລົດ</label>
      <select id="bk_car_type" style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;background:#f8faff;">
        <option value="sedan">🚗 Sedan (1-3 ຄົນ)</option>
        <option value="suv">🚙 SUV (1-6 ຄົນ)</option>
        <option value="van">🚐 Van (1-10 ຄົນ)</option>
        <option value="tuk-tuk">🛺 Tuk-Tuk</option>
      </select>
    </div>`;

  if (type === 'bike') return `
    <div>
      <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">🛵 ປະເພດລົດ</label>
      <select id="bk_bike_type" style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;background:#f8faff;">
        <option value="scooter">🛵 Scooter (ລົດຈັກອັດຕະໂນມັດ)</option>
        <option value="semi-auto">🏍️ Semi-auto</option>
        <option value="atv">🏎️ ATV/Quad bike</option>
        <option value="bicycle">🚲 Bicycle</option>
      </select>
    </div>
    <div>
      <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">🔢 ຈຳນວນລົດ</label>
      <input id="bk_bike_qty" type="number" min="1" max="10" value="1"
        style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
    </div>
    <div>
      <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">📅 ວັນຄືນລົດ</label>
      <input id="bk_return_date" type="date" min="${new Date().toISOString().slice(0,10)}"
        style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
    </div>`;

  if (type === 'hotel') return `
    <div>
      <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">📅 ວັນ Check-out</label>
      <input id="bk_return_date" type="date" min="${new Date().toISOString().slice(0,10)}"
        style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;">
    </div>
    <div>
      <label style="font-size:0.78rem;font-weight:600;color:#3a4a6b;display:block;margin-bottom:5px;">🛏️ ປະເພດຫ້ອງ</label>
      <select id="bk_room_type" style="width:100%;padding:10px 14px;border:1.5px solid #d0d8ec;border-radius:10px;font-size:0.9rem;font-family:inherit;outline:none;background:#f8faff;">
        <option value="standard">Standard</option>
        <option value="deluxe">Deluxe</option>
        <option value="suite">Suite</option>
        <option value="dorm">Dormitory</option>
      </select>
    </div>`;

  return ''; // activity — common fields only
}

// ── SUBMIT BOOKING ──
async function submitBooking(type, placeId, placeName, userId) {
  const name    = document.getElementById('bk_name')?.value.trim();
  const phone   = document.getElementById('bk_phone')?.value.trim();
  const email   = document.getElementById('bk_email')?.value.trim() || null;
  const date    = document.getElementById('bk_date')?.value;
  const persons = parseInt(document.getElementById('bk_persons')?.value) || 1;
  const notes   = document.getElementById('bk_notes')?.value.trim();

  if (!name || !phone || !date) {
    showBkError('ກະລຸນາໃສ່ຂໍ້ມູນທີ່ຕ້ອງການ (*)'); return;
  }

  const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;

  const data = {
    user_id:      session?.userId || null,
    booking_type: type,
    name, phone, email, date, persons, notes,
    place_id:     placeId || null,
    place_name:   placeName || null,
    pickup:       document.getElementById('bk_pickup')?.value.trim() || null,
    dropoff:      document.getElementById('bk_dropoff')?.value.trim() || null,
    car_type:     document.getElementById('bk_car_type')?.value || null,
    bike_type:    document.getElementById('bk_bike_type')?.value || null,
    bike_qty:     parseInt(document.getElementById('bk_bike_qty')?.value) || null,
    return_date:  document.getElementById('bk_return_date')?.value || null,
    room_type:    document.getElementById('bk_room_type')?.value || null,
    status:       'pending'
  };

  // Validate taxi fields
  if (type === 'taxi' && (!data.pickup || !data.dropoff)) {
    showBkError('ກະລຸນາໃສ່ຈຸດຮັບ ແລະ ຈຸດສົ່ງ'); return;
  }

  const btn = document.getElementById('bk_submit');
  btn.disabled = true;
  btn.innerHTML = '⏳ ກຳລັງສົ່ງ...';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session?.accessToken || SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('ສົ່ງ booking ຜິດພາດ');

    // ສຳເລັດ
    document.getElementById('bk_success').style.display = 'block';
    document.getElementById('bk_success').innerHTML = `
      ✅ <strong>${t('bk.success').split('!')[0]}!</strong><br>
      <span style="font-size:0.8rem;">'+t('bk.success').split('!').slice(1).join('!')+'</span>
    `;
    btn.style.display = 'none';

  } catch(e) {
    btn.disabled = false;
    btn.innerHTML = '✅ '+t('bk.confirm');
    showBkError(e.message);
  }
}

function showBkError(msg) {
  const el = document.getElementById('bk_error');
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

function closeBooking() {
  document.getElementById('bookingModal')?.remove();
}

// ── CSS ANIMATION ──
const bkStyle = document.createElement('style');
bkStyle.textContent = '@keyframes slideUpSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}';
document.head.appendChild(bkStyle);
