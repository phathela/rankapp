# RankApp

A social-ranking platform where users can create rankings on any topic (sports, cars, music, countries, phones, etc.), vote using in-app credits ("Ranks"), and earn rewards.

## Core Concept

Users spend **Ranks** (R) to create rankings and vote. Rankings have a defined time period, points system, proof fields (video links), comments, revenue distribution, and automated winner certificates.

- **1 R = $0.10 USD**
- Creating a ranking costs **10 R**
- Voting costs **points × points_per_rank R**

### Revenue Distribution (from total Ranks spent in a ranking)

| Share | Percentage | Recipient |
|-------|-----------|-----------|
| Initiator | 25% | Ranking creator |
| Charity | 25% | Winner's chosen charity |
| Top Contributors | 25% | Top 20 voters by engagement |
| Platform | 25% | Operational costs |

## Tech Stack

- **Backend**: Node.js + Express.js (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Authentication**: JWT + bcrypt
- **Payments**: Stripe
- **PDF Generation**: PDFKit
- **Hosting**: Railway-ready (Docker)

## Project Structure

```
rankapp/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/      # Auth, validation
│   │   ├── routes/          # Route definitions
│   │   ├── services/        # Stripe, PDF generation
│   │   └── index.ts         # Server entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # React hooks (auth context)
│   │   ├── pages/           # Page components
│   │   └── lib/             # Utilities
│   └── package.json
├── Dockerfile               # Production build
├── docker-compose.yml       # Local development
├── railway.json             # Railway deployment config
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Stripe account (for payments)

### Local Development

1. **Clone and install dependencies**

```bash
git clone https://github.com/yourusername/rankapp.git
cd rankapp

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and Stripe keys

# Frontend
cd ../frontend
npm install
```

2. **Set up the database**

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

3. **Start development servers**

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

4. Open http://localhost:5173

### Docker Development

```bash
docker compose up
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `FRONTEND_URL` | Frontend URL for CORS |
| `PORT` | Server port (default: 3001) |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/profile` — Get user profile (auth)

### Categories
- `GET /api/categories` — List all categories with subcategories

### Rankings
- `POST /api/rankings` — Create a ranking (auth, costs 10 R)
- `GET /api/rankings` — List rankings (filterable)
- `GET /api/rankings/trending` — Trending active rankings
- `GET /api/rankings/:id` — Get ranking details
- `POST /api/rankings/:id/vote` — Vote on ranking (auth)
- `POST /api/rankings/:id/close` — Close ranking (initiator only)

### Payments
- `POST /api/payments/create-checkout` — Create Stripe checkout session
- `POST /api/payments/webhook` — Stripe webhook handler
- `GET /api/payments/transactions` — User transaction history

### Comments
- `GET /api/rankings/:id/comments` — Get comments
- `POST /api/rankings/:id/comments` — Add comment (auth, must have voted)
- `POST /api/comments/:id/like` — Toggle like on comment

### Winners
- `GET /api/winners` — List winners (filterable)
- `GET /api/winners/:id` — Winner details

### Admin
- `POST /api/admin/engagement-scores` — Set engagement scores
- `POST /api/admin/distributions/:id/complete` — Complete distribution
- `GET /api/admin/distributions` — List pending distributions
- `GET /api/admin/stats` — Dashboard stats

## Deployment on Railway

1. Push to GitHub
2. Connect repository on Railway
3. Set environment variables in Railway dashboard
4. Deploy — the Dockerfile handles the build automatically

Railway will provision PostgreSQL and deploy the app.

## Stripe Webhook Setup

For local development with Stripe:
```bash
stripe listen --forward-to localhost:3001/api/payments/webhook
```

Add the webhook signing secret to your `.env` file.

## License

MIT
