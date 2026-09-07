from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers import auth, hosted_zones, records

app = FastAPI(title="Route53 Clone API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Normalize FastAPI's 422 payload to the {detail: string} contract.
    first = exc.errors()[0] if exc.errors() else {}
    loc = ".".join(str(p) for p in first.get("loc", []) if p != "body")
    msg = first.get("msg", "Invalid request")
    detail = f"{loc}: {msg}" if loc else msg
    return JSONResponse(status_code=400, content={"detail": detail})


app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(records.router)


@app.get("/", tags=["meta"])
def root():
    return {"service": "route53-clone", "status": "ok", "docs": "/docs"}


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
