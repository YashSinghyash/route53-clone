# Route53 Clone

A functional clone of the AWS Route53 console — hosted zones and DNS records management with a mocked authentication system, built to closely match the real Route53 UI/UX.

**Tech stack:** Next.js (TypeScript) · FastAPI · SQLite · SQLAlchemy · Alembic · JWT · AWS Cloudscape Design System

---

## Table of Contents
- [Setup Instructions](#setup-instructions)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Mocked Sections](#mocked-sections)

---

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm

### Backend

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# copy env template and adjust if needed
cp .env.example .env

# apply database migrations (creates route53.db)
./venv/bin/alembic upgrade head

# run the server
./venv/bin/uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. Interactive API docs (Swagger UI) at `http://localhost:8000/docs`.

**Mock login credentials:**
| Username | Password | Role |
|---|---|---|
| `yash` | `password123` | Admin |
| `guest` | `guestpass` | ReadOnly |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`. Make sure the backend is running first, since the frontend calls it directly at `http://localhost:8000/api/...`.

### Running the backend test suite

```bash
cd backend
./venv/bin/python3 tests/test_flow.py
```

This runs an end-to-end smoke test (auth, hosted zone CRUD, DNS record CRUD across all 9 record types, validation edge cases, cascade deletes) against a live running server.

---

## Architecture Overview

```
┌─────────────────┐        REST (JSON)        ┌──────────────────┐        ┌─────────────┐
│   Next.js App    │ ────────────────────────► │   FastAPI App     │ ─────► │   SQLite    │
│  (TypeScript)     │ ◄──────────────────────── │   (Python)         │ ◄───── │  (route53.db)│
│  Cloudscape UI    │      JWT Bearer token      │  SQLAlchemy ORM    │        └─────────────┘
└─────────────────┘                            └──────────────────┘
```

**Request flow:** Browser → Next.js page → `lib/api.ts` (typed fetch client, attaches JWT) → FastAPI router → service layer (business logic + validation) → SQLAlchemy → SQLite → response bubbles back up.

### Backend layers
- **`routers/`** — thin HTTP layer; parses requests, calls services, returns responses. No business logic lives here.
- **`services/`** — business logic: CRUD operations, per-record-type validation, CNAME-conflict checks, default-record creation.
- **`models/`** — SQLAlchemy ORM models (`HostedZone`, `DnsRecord`).
- **`schemas/`** — Pydantic request/response schemas, used for validation and OpenAPI generation.
- **`core/`** — cross-cutting concerns: JWT encode/decode (`security.py`), mocked IAM user table, environment config (`config.py`).

### Frontend layers
- **`app/`** — Next.js App Router pages (login, hosted zones list, zone detail/records, create-zone full page, coming-soon placeholders).
- **`components/`** — reusable UI: `ConsoleLayout` (shared AppLayout shell), modals for create/edit/delete.
- **`context/`** — React context for auth state (JWT persistence) and global notifications (Flashbar).
- **`lib/api.ts`** — typed fetch wrapper; attaches `Authorization: Bearer <token>` to every request, handles 401s.

### Authentication
Mocked IAM (hardcoded, hashed-password user table) issues a JWT (HS256, 1-hour expiry) on login. The frontend stores the token in `localStorage` for session persistence across page refresh/browser restart, and attaches it as a Bearer token on every API call. No real AWS IAM, Organizations, Accounts, or Billing integration — all mocked per assignment scope.

### Why JWT over session cookies
Frontend and backend are designed to deploy to different domains (Vercel + Render/Railway). Cross-origin cookies require careful `SameSite`/`Secure` configuration and are increasingly restricted by browsers. A Bearer token in an `Authorization` header sidesteps cross-origin cookie issues entirely.

---

## Database Schema

SQLite, managed via Alembic migrations (`backend/alembic/versions/`).

### `hosted_zones`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (PK) | e.g. `/hostedzone/XXXXXXXX` |
| `name` | TEXT, UNIQUE, NOT NULL | domain name, trailing-dot normalized |
| `comment` | TEXT | optional description |
| `private_zone` | INTEGER (bool) | 0 = public, 1 = private |
| `record_count` | INTEGER | kept in sync with actual record count |
| `caller_reference` | TEXT | unique reference, mirrors Route53's field |
| `created_at` / `updated_at` | REAL | unix timestamps |

### `dns_records`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (PK) | UUID |
| `zone_id` | TEXT (FK → `hosted_zones.id`, `ON DELETE CASCADE`) | |
| `name` | TEXT, NOT NULL | record name |
| `type` | TEXT, NOT NULL | one of: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA |
| `ttl` | INTEGER | default 300 |
| `value` | TEXT, NOT NULL | format depends on type (see below) |
| `created_at` / `updated_at` | REAL | unix timestamps |

Every new hosted zone auto-creates 2 default records (NS + TXT, standing in for Route53's default NS/SOA records) to mirror real Route53 behavior.

### Per-type value validation
| Type | Format |
|---|---|
| A | valid IPv4 |
| AAAA | valid IPv6 |
| CNAME, NS, PTR | valid domain name |
| TXT | non-empty string |
| MX | `<priority> <mailserver>` |
| SRV | `<priority> <weight> <port> <target>` |
| CAA | `<flags> <issue\|issuewild\|iodef> <value>` |

CNAME records are exclusive — creating a CNAME at a name that already has other records (or vice versa) returns `409 Conflict`, matching real DNS/Route53 behavior.

---

## API Overview

Full interactive documentation: `http://localhost:8000/docs` (Swagger UI, auto-generated from the FastAPI app) or `http://localhost:8000/openapi.json` for the raw spec.

### Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | `{username, password}` | Returns `{access_token, token_type, user}` |
| POST | `/api/auth/logout` | — | Stateless JWT; client discards token |
| GET | `/api/auth/me` | — | Requires `Authorization: Bearer <token>` |

### Hosted Zones
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/hosted-zones?search=&page=&limit=` | — | Paginated list, optional search |
| POST | `/api/hosted-zones` | `{name, comment?, private_zone?}` | `409` on duplicate name |
| GET | `/api/hosted-zones/{id}` | — | |
| PUT | `/api/hosted-zones/{id}` | `{comment?, private_zone?}` | Name is immutable after creation |
| DELETE | `/api/hosted-zones/{id}` | — | Cascade-deletes all records in the zone |

### DNS Records
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/hosted-zones/{id}/records?search=&type=&page=&limit=` | — | Paginated, filterable by type and name |
| POST | `/api/hosted-zones/{id}/records` | `{name, type, value, ttl?}` | Validated per type |
| PUT | `/api/records/{id}` | `{value?, ttl?}` | Name and type are immutable after creation |
| DELETE | `/api/records/{id}` | — | |

**Response shapes:** list endpoints return `{items, count, page, limit}`; errors return `{detail}` with standard HTTP status codes (`400` validation, `401` unauthorized, `404` not found, `409` conflict).

---

## Project Structure

```
route53-clone/
├── backend/
│   ├── app/
│   │   ├── core/        # JWT security, mocked IAM, config
│   │   ├── models/       # SQLAlchemy: HostedZone, DnsRecord
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── routers/      # auth, hosted_zones, records
│   │   ├── services/     # business logic + validation
│   │   ├── db.py
│   │   └── main.py
│   ├── alembic/           # DB migrations
│   ├── tests/
│   │   └── test_flow.py   # end-to-end smoke test
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/                        # Next.js App Router pages
│   │   ├── login/
│   │   ├── hosted-zones/
│   │   │   ├── page.tsx             # list
│   │   │   ├── create/page.tsx      # full-page create (matches real Route53)
│   │   │   └── [id]/records/        # zone detail / DNS records
│   │   ├── dashboard/, health-checks/, profiles/, traffic-flow/, resolver/...
│   │   └── (coming-soon placeholders for mocked sections)
│   ├── components/                  # ConsoleLayout, modals
│   ├── context/                     # AuthContext, NotificationContext
│   └── lib/api.ts                   # typed API client
└── README.md
```

---

## Mocked Sections

Per assignment scope, these sections are present as "Coming soon" placeholders within the same console shell, matching the real Route53 sidebar structure (including nested Global Resolver / VPC Resolver / Domains / IP-based routing / Traffic flow sections):

- Dashboard
- Traffic Policies / Traffic flow
- Health Checks
- Resolver (Global Resolver, VPC Resolver)
- Profiles
- Domains, IP-based routing

IAM, AWS Accounts, Organizations, and Billing are mocked as described in [Authentication](#authentication) — no real AWS API calls are made anywhere in this project.