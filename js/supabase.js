/* ═══════════════════════════════════════════════
   Supabase Config — v2 (retry + timeout)
═══════════════════════════════════════════════ */
const SUPABASE_URL = "https://axqgotrbnglssxhwkfjc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cWdvdHJibmdsc3N4aHdrZmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDQ4NzgsImV4cCI6MjA4Nzk4MDg3OH0.yUGLC-dSAJ3YhfFtws-p_P4mBwyma85GvA1uHoeGtJg";

// ── Fetch with timeout helper ──
async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// ── Supabase REST API helper ──
const db = {
  async getPlaces(filters = {}, retries = 2) {
    let url = `${SUPABASE_URL}/rest/v1/places?select=*&order=rating.desc.nullslast,id.asc`;
    if (filters.category) url += `&category=eq.${filters.category}`;
    if (filters.eco)      url += `&is_eco=eq.true`;
    if (filters.search)   url += `&or=(name.ilike.*${encodeURIComponent(filters.search)}*,description.ilike.*${encodeURIComponent(filters.search)}*,name_en.ilike.*${encodeURIComponent(filters.search)}*)`;

    const headers = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetchWithTimeout(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        if (attempt === retries) throw new Error("ດຶງຂໍ້ມູນຜິດພາດ: " + err.message);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // exponential backoff
      }
    }
  },

  async getPlaceById(id) {
    const url = `${SUPABASE_URL}/rest/v1/places?id=eq.${id}&select=*`;
    const res = await fetchWithTimeout(url, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) throw new Error("ດຶງຂໍ້ມູນຜິດພາດ");
    const data = await res.json();
    return data[0] || null;
  }
};
