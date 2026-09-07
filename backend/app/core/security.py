import hashlib
import time
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hashlib.sha256(plain.encode("utf-8")).hexdigest() == hashed


# --- Mocked AWS IAM user table -------------------------------------------------
# Passwords are stored sha256-hashed, never in plaintext.
MOCK_IAM_USERS = {
    "yash": {
        "username": "yash",
        "password_hash": hash_password("password123"),
        "role": "Admin",
        "account_id": "000000000001",
    },
    "guest": {
        "username": "guest",
        "password_hash": hash_password("guestpass"),
        "role": "ReadOnly",
        "account_id": "000000000001",
    },
}


def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = MOCK_IAM_USERS.get(username)
    if not user or not verify_password(password, user["password_hash"]):
        return None
    return user


def public_user(user: dict) -> dict:
    return {
        "username": user["username"],
        "role": user["role"],
        "account_id": user["account_id"],
    }


def create_access_token(user: dict) -> str:
    now = int(time.time())
    payload = {
        "sub": user["username"],
        "role": user["role"],
        "account_id": user["account_id"],
        "iat": now,
        "exp": now + settings.JWT_EXPIRE_MINUTES * 60,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if creds is None or not creds.credentials:
        raise unauthorized
    try:
        payload = jwt.decode(
            creds.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        raise unauthorized

    username = payload.get("sub")
    if not username or username not in MOCK_IAM_USERS:
        raise unauthorized
    return {
        "username": username,
        "role": payload.get("role"),
        "account_id": payload.get("account_id"),
    }
