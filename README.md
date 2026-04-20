# 🌿 VangVieng Explorer

Production tourism web app for Vang Vieng, Laos. Built with Vanilla JS + Supabase + Cloudflare Workers.

**Live:** [lao-trips.com](https://www.lao-trips.com)

---

## 📁 ໂຄງສ້າງ Folder

```
vangvieng-explorer/
├── index.html              ← Home page
├── pages/
│   ├── explore.html        ← ຄົ້ນຫາ + filter + sort
│   ├── map.html            ← ແຜນທີ່ OpenStreetMap
│   ├── detail.html         ← ລາຍລະອຽດ + gallery + reviews
│   ├── ai-chat.html        ← AI chat "ນ້ອງວຽງ" (Cloudflare → Claude)
│   ├── booking.html        ← ລະບົບຈອງ (4 ປະເພດ)
│   ├── saved.html          ← ສະຖານທີ່ທີ່ບັນທຶກໄວ້
│   ├── admin.html          ← Admin dashboard
│   └── login.html          ← Supabase Auth
├── js/
│   ├── app.js              ← Core: renderPlaceCard, stats, toast, nav
│   ├── explore.js          ← Filter, sort, search
│   ├── detail.js           ← Gallery, share, reviews, view counter
│   ├── ai-chat.js          ← Chat UI + server-side quota (v3)
│   ├── trip-planner.js     ← AI trip plan generator
│   ├── auth.js             ← Supabase Auth + badge sync (v3)
│   ├── booking.js          ← Booking system logic
│   ├── i18n.js             ← ແປ 5 ພາສາ (lo/en/th/zh/ko)
│   ├── reviews.js          ← Submit + render reviews
│   ├── map.js              ← Map markers + filter
│   ├── saved.js            ← Cloud saved places (Supabase)
│   ├── active-trip.js      ← Active trip tracker
│   └── supabase.js         ← Supabase REST client config
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
├── service-worker.js       ← Offline cache
└── CNAME                   ← Custom domain (lao-trips.com)
```

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML + CSS + Vanilla JavaScript |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Claude Haiku via Cloudflare Worker proxy |
| Quota System | Supabase `ai_usage` table + atomic RPC functions |
| Images | Cloudinary upload worker |
| PWA | service-worker.js + manifest.json |
| Hosting | GitHub Pages + Cloudflare (custom domain) |

---

## 🌐 External Services

| Service | Endpoint |
|---|---|
| Supabase Project | `axqgotrbnglssxhwkfjc.supabase.co` |
| AI Proxy (Claude) | `api.lao-trips.com` (Cloudflare Worker) |
| Image Upload | `cloudinary-upload.duan-test001.workers.dev` |
| Custom Domain | `lao-trips.com` (via Cloudflare) |

---

## 🔐 Authentication & Roles

Uses **Supabase Auth** (email/password) with role-based access:

| Role | AI Limit/day | Permissions |
|---|---|---|
| `guest` | 3 | View only, client-side quota |
| `user` | 10 | Full access, server-side quota |
| `press` | 30 | Enhanced AI quota |
| `admin` | unlimited | Full platform control |

User roles are stored in `user_profiles` table (`role`, `ai_limit` columns).

---

## 🤖 AI Quota System (Server-Side)

**ລະບົບປ້ອງກັນການໂກງໂຄຕ້າ AI** — ໂຄຕ້າເກັບຢູ່ Supabase, ບໍ່ແມ່ນ localStorage.

### Architecture

```
┌──────────┐        ┌─────────────────────┐        ┌──────────┐
│ Browser  │─────▶ │  Cloudflare Worker  │─────▶ │ Supabase │
│          │  JWT   │  api.lao-trips.com  │  RPC   │ ai_usage │
│          │        │  1. verify token    │        │   table  │
│          │        │  2. consume quota   │        └──────────┘
│          │◀──────│  3. call Claude     │             ▲
│          │        │  4. refund if fail  │             │
└──────────┘        └─────────────────────┘        ┌────┴────┐
                                                    │ Claude  │
                                                    │   API   │
                                                    └─────────┘
```

### Supabase Schema

**Table:** `ai_usage`
```sql
user_id       uuid       -- auth.users reference
usage_date    date       -- Asia/Vientiane timezone
request_count int        -- incremented per AI call
last_used_at  timestamptz
primary key (user_id, usage_date)
```

**Functions:**
- `consume_ai_quota(user_id, limit)` → atomic check + increment
- `refund_ai_quota(user_id)` → rollback on API failure
- `get_ai_usage(user_id)` → read current usage

**RLS:** Users read only own usage. Service role writes (via Worker).

### Protection Matrix

| Attack | Before | After |
|---|---|---|
| Clear localStorage | ✅ Reset quota | ❌ Stored on server |
| Multiple browsers | ✅ Multiplied quota | ❌ Synced across devices |
| Incognito mode | ✅ Fresh quota | ❌ Must login |
| API direct call | ✅ Open endpoint | ❌ 401 without JWT |
| DevTools manipulation | ✅ Easy | ❌ Server authoritative |

---

## 🚀 Cloudflare Worker

**Endpoint:** `https://api.lao-trips.com`

**Required Secrets:**
- `ANTHROPIC_KEY` — Claude API key
- `SUPABASE_URL` — Project URL
- `SUPABASE_ANON_KEY` — For JWT verification
- `SUPABASE_SERVICE_KEY` — For quota RPC calls (bypasses RLS)

**Flow:**
1. Verify JWT → extract `user_id`
2. Fetch profile → `role` + `ai_limit`
3. Skip quota if `role=admin`
4. Call `consume_ai_quota()` → 429 if exceeded
5. Call Claude API → return response with `_usage`
6. On upstream error → `refund_ai_quota()` → 502

---

## 💻 ວິທີ Run (Development)

```bash
# ໂຄຼນ repo
git clone https://github.com/YOUR_USERNAME/vangvieng-explorer
cd vangvieng-explorer

# ເປີດ index.html ດ້ວຍ browser
# ຫຼືໃຊ້ VS Code Live Server extension
```

**ສຳລັບການທົດສອບ AI chat:**
- ຕ້ອງ login ດ້ວຍ Supabase account (ສ້າງຜ່ານ `pages/login.html`)
- Guest mode ໃຊ້ໄດ້ 3 ຄັ້ງ/ວັນ (client-side quota)

---

## ✨ Features

### Core
- ✅ Home page + featured places
- ✅ Explore: filter by category, eco, search, sort
- ✅ Detail page: gallery, share, reviews, view counter
- ✅ Map page — OpenStreetMap markers
- ✅ Multi-language: ລາວ / English / ໄທ / 中文 / 한국어
- ✅ PWA (installable, offline cache)

### AI (Powered by Claude Haiku)
- ✅ AI Chat "ນ້ອງວຽງ" — travel guide
- ✅ Trip Planner — AI-generated multi-day plans
- ✅ Server-side quota (cross-device sync)
- ✅ Auto-refund on API failure

### Booking & Commerce
- ✅ 4 booking types (tours, activities, transport, stays)
- ✅ Admin dashboard with analytics

### Auth & User
- ✅ Supabase Auth (email/password)
- ✅ Role-based access (user/press/admin)
- ✅ Cloud-saved places (synced via Supabase)
- ✅ User reviews with RLS

---

## 📊 Admin Queries (Supabase SQL Editor)

### Monitor AI Usage
```sql
-- Top users in last 7 days
select user_id, sum(request_count) as total
from ai_usage
where usage_date > current_date - interval '7 days'
group by user_id
order by total desc limit 20;
```

### Reset User Quota
```sql
update ai_usage
set request_count = 0
where user_id = 'USER-UUID' and usage_date = current_date;
```

### Upgrade User to Premium
```sql
update user_profiles set ai_limit = 50
where id = 'USER-UUID';
```

---

## 🐛 Common Issues

**401 "Invalid or expired token"**
→ Supabase access tokens expire after 1 hour. Logout + login refreshes.

**Badge shows wrong count**
→ Hard refresh (Ctrl+Shift+R) forces Supabase re-fetch.

**"consume_ai_quota failed" in Worker logs**
→ Check `SUPABASE_SERVICE_KEY` is the `service_role` key (not `anon`).

---

## 📝 Version History

- **v3** (Apr 2026) — Server-side AI quota via Supabase
- **v2** (Early 2026) — Supabase Auth migration + bookings
- **v1** (2025) — Initial static build with localStorage auth
