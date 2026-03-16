
// ── NAV BADGE (ໃຊ້ໄດ້ທຸກໜ້າ) ──
function updateNavBadge() {
  const n = Object.keys(getSaved()).length;
  document.querySelectorAll('#savedBadge').forEach(el => {
    el.textContent = n > 0 ? n : '';
    el.style.display = n > 0 ? 'inline-flex' : 'none';
  });
}
