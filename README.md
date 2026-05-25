# Ad Agency Management System

Full-stack web application for managing advertising agency clients and orders.

## Tech Stack

- **Backend**: FastAPI + Python 3.10+, SQLAlchemy ORM, SQLite, JWT auth
- **Frontend**: React 18 + TypeScript + Tailwind CSS, Vite

## Features

- JWT-based authentication (login/register)
- Dashboard with summary stats (revenue, active orders, recent activity)
- Orders table with filtering (status, client search), pagination, create/edit/delete
- Auto-applied discount tiers based on client order history
- Client directory with full order history and inline editing
- Overdue order detection (deadline passed + not completed)
- Toast notifications and confirmation dialogs
- Swagger UI at `http://localhost:8000/docs`

## Discount System

| Previous Orders | Discount |
|-----------------|----------|
| 3–5             | 5%       |
| 6–10            | 10%      |
| 11+             | 15%      |

## Service Pricing

| Service                | Base Price |
|------------------------|------------|
| Web Design             | $1,000     |
| Graphic Design         | $500       |
| Social Media Campaign  | $2,000     |
| Video Production       | $3,000     |
| Copywriting            | $300       |

Scope multipliers: Small ×0.75, Medium ×1.0, Large ×1.5

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # edit SECRET_KEY if needed
python seed_data.py               # loads 5 clients + 20 orders
uvicorn main:app --reload
# API at http://localhost:8000
# Docs at http://localhost:8000/docs
```

## Frontend Setup

```bash
cd frontend
npm install
# Optional: create .env.local with VITE_API_URL=http://localhost:8000
npm run dev
# App at http://localhost:5173
```

## Demo Credentials

```
Email:    admin@adagency.com
Password: admin123
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Get JWT token |
| GET | /api/dashboard | Summary stats |
| GET | /api/clients | List clients |
| POST | /api/clients | Create client |
| GET | /api/clients/{id} | Client + order history |
| PUT | /api/clients/{id} | Update client |
| DELETE | /api/clients/{id} | Delete client |
| GET | /api/orders | List orders (filterable) |
| POST | /api/orders | Create order (auto-discount) |
| GET | /api/orders/{id} | Order details |
| PUT | /api/orders/{id} | Update order |
| DELETE | /api/orders/{id} | Delete order |

## Project Structure

```
ad_agency/
├── backend/
│   ├── main.py          # FastAPI app
│   ├── database.py      # SQLAlchemy setup
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── routers/         # API endpoints
│   ├── core/            # Config, security, deps
│   ├── utils/pricing.py # Pricing + discount logic
│   └── seed_data.py     # Test data
└── frontend/
    └── src/
        ├── pages/       # Route-level components
        ├── components/  # Reusable UI
        ├── hooks/       # useAuth, useFetch, useToast
        ├── services/    # API client wrappers
        └── types/       # TypeScript types
```
