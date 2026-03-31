# 🌿 VangVieng Explorer

Tourism web app for Vang Vieng, Laos. Built with Vanilla JS + Supabase.

## ໂຄງສ້າງ Folder

```
vangvieng-explorer/
├── index.html              ← Home page
├── pages/
│   ├── explore.html        ← ຄົ້ນຫາ + filter + sort
│   ├── map.html            ← ແຜນທີ່ OpenStreetMap
│   ├── detail.html         ← ລາຍລະອຽດ + gallery + reviews
│   ├── ai-chat.html        ← AI chat "ນ້ອງວຽງ" (Cloudflare → Claude)
│   ├── saved.html          ← ສະຖານທີ່ທີ່ບັນທຶກໄວ້
│   └── login.html          ← Demo auth
├── js/
│   ├── app.js              ← Core: renderPlaceCard, stats, toast, nav
│   ├── explore.js          ← Filter, sort, search
│   ├── detail.js           ← Gallery, share, reviews, view counter
│   ├── ai-chat.js          ← Chat UI + callClaude + rate limit
│   ├── trip-planner.js     ← AI trip plan generator
│   ├── auth.js             ← Demo session + RateLimit (localStorage)
│   ├── i18n.js             ← ແປ 5 ພາສາ (lo/en/th/zh/ko)
│   ├── reviews.js          ← Submit + render reviews
│   ├── map.js              ← Map markers + filter
│   ├── saved.js            ← Bookmarks
│   ├── active-trip.js      ← Active trip tracker
│   └── supabase.js         ← Supabase REST client (getPlaces, getPlaceById)
├── css/
│   ├── style.css           ← Design system (global)
│   ├── ai-chat.css
│   ├── detail.css
│   ├── explore.css
│   ├── map.css
│   └── saved.css
├── assets/
│   └── logo.png
├── manifest.json           ← PWA config
└── service-worker.js       ← Offline cache
```

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML + CSS + Vanilla JavaScript |
| Database | Supabase (PostgreSQL REST API) |
| AI | Claude API via Cloudflare Worker proxy |
| Images | Cloudinary upload worker |
| PWA | service-worker.js + manifest.json |
| Hosting | Vercel / static hosting |

## External Services

| Service | URL / Detail |
|---|---|
| Supabase | `axqgotrbnglssxhwkfjc.supabase.co` |
| AI Proxy (CF Worker) | `gemini-proxy.duan-test001.workers.dev` |
| Image Upload (CF Worker) | `cloudinary-upload.duan-test001.workers.dev` |

## Auth (Demo)

| Username | Password | Role | AI Limit/day |
|---|---|---|---|
| guest | — | guest | 3 |
| demo | vangvieng2024 | demo | 10 |
| demo_press | press2024 | press | 30 |
| admin | vve@admin2024 | admin | unlimited |

## ວິທີ Run

```bash
# ດາວໂຫຼດ folder ທັງໝົດ
# ເປີດ index.html ດ້ວຍ browser ໄດ້ທັນທີ
# ຫຼືໃຊ້ VS Code Live Server extension
```

## Features

- ✅ Home page + featured places
- ✅ Explore: filter by category, eco, search, sort
- ✅ Detail page: gallery, share, reviews, view counter
- ✅ AI Chat "ນ້ອງວຽງ" — travel guide ຮູ້ຈັກວັງວຽງ
- ✅ Trip Planner — AI plan generator ຕາມ style/days/group
- ✅ Map page — OpenStreetMap markers
- ✅ Saved places (localStorage)
- ✅ Multi-language: ລາວ / English / ໄທ / 中文 / 한국어
- ✅ PWA (installable, offline cache)
- ✅ Demo auth + daily rate limit
