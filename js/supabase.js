/**
 * 🌿 VangVieng Explorer - Supabase API Client
 * Optimized for performance and error handling.
 */
const supabaseUrl = 'https://axqgotrbnglssxhwkfjc.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // ກະລຸນາວາງ Key ຂອງເຈົ້າໃສ່ນີ້
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const vveApi = {
    // ດຶງຂໍ້ມູນສະຖານທີ່ທັງໝົດ ພ້ອມລະບົບ Filter
    async getPlaces(options = {}) {
        try {
            let query = supabase.from('places').select('*');

            if (options.category && options.category !== 'all') {
                query = query.eq('category', options.category);
            }
            if (options.is_eco) {
                query = query.eq('is_eco', true);
            }

            // ລຽງລໍາດັບຕາມ Rating ຫຼື ວັນທີ
            const orderBy = options.orderBy || 'rating';
            query = query.order(orderBy, { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("API Error [getPlaces]:", err.message);
            vveApp.showToast("ບໍ່ສາມາດດຶງຂໍ້ມູນສະຖານທີ່ໄດ້", "error");
            return [];
        }
    },

    // ດຶງຂໍ້ມູນສະຖານທີ່ດຽວຕາມ ID
    async getPlaceById(id) {
        try {
            const { data, error } = await supabase
                .from('places')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("API Error [getPlaceById]:", err.message);
            return null;
        }
    }
};
