# Golf Charity Subscription Platform

A subscription-driven web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine.

Built by: Digital Heroes · digitalheroes.co.in

---

## Tech Stack

| Layer      | Technology                              |
|------------|----------------------------------------|
| Frontend   | React 18, Vite, TailwindCSS, Framer Motion |
| Backend    | Node.js, Express.js                    |
| Database   | Supabase (PostgreSQL)                  |
| Auth       | Supabase Auth + JWT                    |
| Payments   | Stripe                                 |
| Deployment | Vercel (frontend) + Vercel (backend)   |

---

## Project Structure

```
golf-charity-platform/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Reusable UI components
│   │   │   ├── layout/       # Layout wrappers
│   │   │   ├── auth/         # Auth forms
│   │   │   ├── dashboard/    # User dashboard widgets
│   │   │   ├── admin/        # Admin panel components
│   │   │   ├── charity/      # Charity listing & profile
│   │   │   ├── draw/         # Draw & prize components
│   │   │   └── score/        # Score entry & display
│   │   ├── pages/
│   │   │   ├── public/       # Landing, charities, how it works
│   │   │   ├── user/         # Dashboard, scores, settings
│   │   │   └── admin/        # Admin panel pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # React context providers
│   │   ├── services/         # API service layer
│   │   ├── utils/            # Helper functions
│   │   └── styles/           # Global styles & tokens
│   └── package.json
│
├── backend/           # Express API
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── routes/           # Express route definitions
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── services/         # Business logic layer
│   │   ├── validators/       # Request validation schemas
│   │   ├── utils/            # Utilities & helpers
│   │   └── config/           # App configuration
│   ├── scripts/              # DB seed & migration helpers
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- A Supabase project (new, not personal)
- A Stripe account

### 1. Clone & Install

```bash
# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Environment Variables

**backend/.env**
```
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Database Setup

Run the SQL schema found in `backend/scripts/schema.sql` in your Supabase SQL editor.

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## Test Credentials

After seeding the database (`npm run seed` in backend):

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@golfcharity.com | Admin@1234 |
| User  | user@golfcharity.com  | User@1234  |

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
vercel --prod
```

### Backend → Vercel (Serverless)
```bash
cd backend
vercel --prod
```

Set all environment variables in the Vercel dashboard under Project Settings → Environment Variables.

---

## Features

- ✅ Subscription plans (Monthly & Yearly) via Stripe
- ✅ Rolling 5-score system (Stableford format)
- ✅ Monthly draw engine (random + weighted algorithm)
- ✅ Prize pool split (40% / 35% / 25%)
- ✅ Jackpot rollover for 5-match if unclaimed
- ✅ Charity directory with contribution tracking
- ✅ Winner verification with proof upload
- ✅ Full admin dashboard
- ✅ Mobile-first responsive design
- ✅ JWT authentication with Supabase
