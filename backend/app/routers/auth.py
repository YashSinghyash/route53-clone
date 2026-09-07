from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import (
    authenticate_user,
    create_access_token,
    get_current_user,
    public_user,
)
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse, MessageResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    user = authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password"
        )
    token = create_access_token(user)
    return LoginResponse(access_token=token, token_type="bearer", user=public_user(user))


@router.post("/logout", response_model=MessageResponse)
def logout():
    # Stateless JWT: the client discards the token. Nothing to clear server-side.
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=MeResponse)
def me(current_user: dict = Depends(get_current_user)):
    return MeResponse(user=current_user)
