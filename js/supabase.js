/**
 * 🌿 VangVieng Explorer - Supabase API Client
 */
const supabaseUrl = 'https://axqgotrbnglssxhwkfjc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cWdvdHJibmdsc3N4aHdrZmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDQ4NzgsImV4cCI6MjA4Nzk4MDg3OH0.yUGLC-dSAJ3YhfFtws-p_P4mBwyma85GvA1uHoeGtJg'; // ເອົາ Key ແທ້ຂອງເຈົ້າວາງໃສ່ນີ້

let supabase;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("ຍັງບໍ່ໄດ້ໂຫຼດ Supabase Script ຈາກ CDN");
    }
} catch (e) {
    console.error("Supabase Init Error:", e.message);
}

const vveApi = {
    // ຟັງຊັນດຶງຂໍ້ມູນສະຖານທີ່ທັງໝົດ
    async getPlaces(options = {}) {
        if (!supabase) return []; // ປ້ອງກັນໜ້າຈໍຂາວຖ້າເຊື່ອມຕໍ່ບໍ່ໄດ້
        
        try {
            let query = supabase.from('places').select('*');
            if (options.category && options.category !== 'all') query = query.eq('category', options.category);
            if (options.is_eco) query = query.eq('is_eco', true);

            const { data, error } = await query.order('rating', { ascending: false });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("Fetch Error:", err.message);
            return [];
        }
    },

    // ຟັງຊັນດຶງຂໍ້ມູນສະຖານທີ່ດຽວ (ສຳລັບໜ້າ Detail)
    async getPlaceById(id) {
        if (!supabase) return null;
        
        try {
            const { data, error } = await supabase.from('places').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("Fetch Error [getPlaceById]:", err.message);
            return null;
        }
    }
};
