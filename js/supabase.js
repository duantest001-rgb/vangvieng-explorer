/* ═══════════════════════════════════════════════
   Supabase Config
═══════════════════════════════════════════════ */
const SUPABASE_URL = "https://axqgotrbnglssxhwkfjc.supabase.co";
const SUPABASE_KEY = "sb_publishable_Jx8kMe3QiaBZ3rE9T7OHtA_hxrbgW5b";

// ── Supabase REST API helper ──
const db = {
  async getPlaces(filters = {}) {
    let url = `${SUPABASE_URL}/rest/v1/places?select=*&order=rating.desc`;

    if (filters.category) url += `&category=eq.${filters.category}`;
    if (filters.eco)      url += `&is_eco=eq.true`;
    if (filters.search)   url += `&or=(name.ilike.*${filters.search}*,description.ilike.*${filters.search}*,name_en.ilike.*${filters.search}*)`;

    const res = await fetch(url, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw new Error("ດຶງຂໍ້ມູນຜິດພາດ");
    return res.json();
  },

  async getPlaceById(id) {
    const url = `${SUPABASE_URL}/rest/v1/places?id=eq.${id}&select=*`;
    const res = await fetch(url, {
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
