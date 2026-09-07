# route53-clone backend

FastAPI + SQLAlchemy + SQLite + Alembic. JWT (Bearer, HS256) auth.

## Setup

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cp .env.example .env          # then edit JWT_SECRET
./venv/bin/alembic upgrade head
./venv/bin/uvicorn app.main:app --reload
```

Swagger UI: http://localhost:8000/docs · OpenAPI: http://localhost:8000/openapi.json

## Mock IAM users

| username | password | role |
|---|---|---|
| yash | password123 | Admin |
| guest | guestpass | ReadOnly |

## Endpoints

| Method | Path |
|---|---|
| POST | /api/auth/login |
| POST | /api/auth/logout |
| GET | /api/auth/me |
| GET | /api/hosted-zones?search=&page=&limit= |
| POST | /api/hosted-zones |
| GET | /api/hosted-zones/{id} |
| PUT | /api/hosted-zones/{id} |
| DELETE | /api/hosted-zones/{id} |
| GET | /api/hosted-zones/{id}/records?search=&type=&page=&limit= |
| POST | /api/hosted-zones/{id}/records |
| PUT | /api/records/{id} |
| DELETE | /api/records/{id} |

List responses: `{items, count, page, limit}`. Errors: `{detail}`.
