/**
 * 🌿 VangVieng Explorer - Main App Logic
 */
const vveApp = {
    // ຟັງຊັນສ້າງໂຄງສ້າງ Card
    renderPlaceCard(place) {
        return `
            <div class="place-card" data-aos="fade-up">
                <div class="card-img-wrapper">
                    ${place.is_eco ? `<div class="eco-badge"><i class="fas fa-leaf"></i> Eco-Friendly</div>` : ''}
                    <img src="${place.image_url || 'assets/placeholder.jpg'}" alt="${place.name}" loading="lazy">
                </div>
                <div class="card-content">
                    <span class="card-category">${place.category || 'Travel'}</span>
                    <h3 class="card-title">${place.name}</h3>
                    <p class="card-desc">${place.description || 'ສຳຜັດກັບບັນຍາກາດທຳມະຊາດທີ່ວັງວຽງ...'}</p>
                    <div class="card-footer">
                        <div class="rating">
                            <i class="fas fa-star" style="color: #D4AF37;"></i>
                            <span>${place.rating || '0.0'}</span>
                        </div>
                        <a href="pages/detail.html?id=${place.id}" class="btn-detail" style="color: var(--primary); font-weight: 700; text-decoration: none; font-size: 0.85rem;">
                            ລາຍລະອຽດ <i class="fas fa-arrow-right" style="font-size: 0.7rem; margin-left: 5px;"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

    // ຟັງຊັນແຈ້ງເຕືອນ
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    // ຟັງຊັນຈັດການເມນູ
    initNav() {
        const nav = document.querySelector('nav');
        if(nav) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    nav.style.padding = '0.7rem 5%';
                    nav.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
                } else {
                    nav.style.padding = '1rem 5%';
                    nav.style.boxShadow = 'none';
                }
            });
        }
    }
};

// ສັ່ງໃຫ້ແອັບເລີ່ມເຮັດວຽກເມື່ອເປີດໜ້າເວັບ
document.addEventListener('DOMContentLoaded', async () => {
    vveApp.initNav();
    
    // ດຶງຂໍ້ມູນມາສະແດງໃນໜ້າຫຼັກ (ຖ້າມີ ID 'places-grid')
    const container = document.getElementById('places-grid');
    if (container) {
        container.innerHTML = "<p style='text-align:center; width:100%;'>ກຳລັງໂຫຼດຂໍ້ມູນ...</p>";
        
        // ເອີ້ນໃຊ້ຟັງຊັນດຶງຂໍ້ມູນຈາກ supabase.js
        const places = await vveApi.getPlaces();
        
        if (places && places.length > 0) {
            container.innerHTML = places.map(p => vveApp.renderPlaceCard(p)).join('');
        } else {
            container.innerHTML = "<p style='text-align:center; width:100%; color:#d32f2f; background:#ffebee; padding:15px; border-radius:10px;'>ຍັງບໍ່ມີຂໍ້ມູນ ຫຼື ບໍ່ສາມາດເຊື່ອມຕໍ່ຖານຂໍ້ມູນໄດ້ (ກະລຸນາໃສ່ API Key)</p>";
        }
    }
});
