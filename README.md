# DealTiki Web Discovery Platform

DealTiki is a real-time live deal, coupon, and campaign discovery platform. It integrates live deal intelligence from top merchants (Amazon, Flipkart, Myntra, Croma, AJIO, and Cuelinks affiliate networks) with persistent PostgreSQL/Supabase caching and strict tracking link fidelity.

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│     Deal Intelligence Engine    │ (Upstream Backend)
└────────────────┬────────────────┘
                 │ Webhook: POST /api/public-deals/upsert (Bearer DEALTIKI_SYNC_SECRET)
                 │ OR Fallback: GET /api/search?post=false
                 ▼
┌─────────────────────────────────┐
│     DealTiki Express Server     │ (server.ts)
│  - Service-Role Supabase Client │
│  - Real-time Pagination & Cache │
│  - Deterministic ID Resolution  │
└──────┬───────────────────┬──────┘
       │                   │
       ▼                   ▼
┌──────────────┐   ┌─────────────────────────────┐
│   Supabase   │   │  DealTiki React 19 Frontend │
│ public_deals │   │  - Zero Seed Data           │
│     (RLS)    │   │  - Client Anon Supabase     │
└──────────────┘   │  - Authentic Tracking URLs  │
                   └─────────────────────────────┘
```

---

## 🔐 Environment Variables

Create your `.env` file from `.env.example`:

### 1. Server Environment Variables (DO NOT expose in client)

| Variable | Description | Example / Required |
| :--- | :--- | :--- |
| `DEALTIKI_API_BASE_URL` | Upstream live deal search API | `https://deal-intelligence-platform-nine.vercel.app` |
| `DEALTIKI_SYNC_SECRET` | Secret token used to authenticate webhook upserts | Random 32+ char secret |
| `SUPABASE_URL` | Supabase project endpoint | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service key for writing deals | `eyJhbGciOi...` (**NEVER EXPOSE IN FRONTEND**) |

### 2. Client-Safe Public Variables (Prefixed with `VITE_`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Public Supabase URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous read key (restricted by RLS) | `eyJhbGciOi...` |

> ⚠️ **SECURITY WARNING:** Never place `SUPABASE_SERVICE_ROLE_KEY` in `VITE_` variables or frontend source files.

---

## 🗄️ Database Provisioning

Execute the SQL script located in `sql/public_deals.sql` inside your **Supabase SQL Editor**:

1. Creates `public.public_deals` table with proper datatypes.
2. Creates optimized indexes for query performance, active filtering, and deduplication (`post_key`, `source_id`, `expires_at`, `status`).
3. Enables **Row Level Security (RLS)**:
   - **Public Read**: Anyone can read records where `status = 'active'` and (`expires_at IS NULL OR expires_at > NOW()`).
   - **Service Role Write**: Full insert/update/delete privileges for the backend server.
4. Enables **Supabase Realtime** for instant updates.

---

## 📡 Engine-to-Website Webhook Contract

Upstream scrapers and engines sync deals into the website database using:

- **Endpoint:** `POST /api/public-deals/upsert`
- **Header:** `Authorization: Bearer <DEALTIKI_SYNC_SECRET>`
- **Content-Type:** `application/json`
- **Batch Limit:** Up to 100 deals per batch

### Payload Format:

```json
{
  "deals": [
    {
      "source_id": "item-12345",
      "post_key": "cuelinks-offer-9876",
      "title": "boAt Rockerz 450 Bluetooth Wireless Headphone with 15H Playback",
      "description": "Ergonomic fit, 40mm dynamic drivers, immersive HD sound.",
      "image_url": "https://m.media-amazon.com/images/I/51b8hZ6W1LL._SL1500_.jpg",
      "merchant": "Amazon",
      "platform": "amazon",
      "category": "Audio & Electronics",
      "deal_type": "product",
      "mrp": 3990.00,
      "deal_price": 1299.00,
      "discount_percent": 67,
      "rating": 4.2,
      "review_count": 45120,
      "coupon_code": null,
      "affiliate_url": "https://linksredirect.com/?cid=123&url=https%3A%2F%2Famazon.in%2Fdp%2FB07PR1CL3S",
      "affiliate_provider": "Cuelinks",
      "status": "active",
      "starts_at": "2026-08-20T00:00:00Z",
      "expires_at": "2026-08-31T23:59:59Z"
    }
  ]
}
```

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linting & type-check
npm run lint

# Build for production
npm run build

# Start production server
npm start
```
