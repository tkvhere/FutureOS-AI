from fastapi import APIRouter, Header

from backend.models.schemas import ResendVerificationRequest, SignupResponse, TokenResponse, UserCreate, UserLogin, VerificationRequest
from backend.services.auth_service import (
    authenticate_bearer,
    build_public_user,
    create_access_token,
    login_user,
    resend_verification_code,
    signup_user,
    verify_email_code,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse)
def signup(payload: UserCreate):
    user, verification_code, delivered = signup_user(payload.name, payload.email, payload.password)
    return {
        "verification_required": True,
        "email": user["email"],
        "message": "Verification code sent to your Gmail inbox." if delivered else "Verification code created. Use the code shown in this environment to verify your Gmail account.",
        "dev_verification_code": None if delivered else verification_code,
    }


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin):
    user = login_user(payload.email, payload.password)
    token = create_access_token({"sub": user["_id"], "email": user["email"]})
    return {"access_token": token, "user": build_public_user(user)}


@router.post("/verify", response_model=TokenResponse)
def verify(payload: VerificationRequest):
    user = verify_email_code(payload.email, payload.code)
    token = create_access_token({"sub": user["_id"], "email": user["email"]})
    return {"access_token": token, "user": build_public_user(user)}


@router.post("/resend-verification", response_model=SignupResponse)
def resend_verification(payload: ResendVerificationRequest):
    user, verification_code, delivered = resend_verification_code(payload.email)
    return {
        "verification_required": True,
        "email": user["email"],
        "message": "Verification code sent to your Gmail inbox." if delivered else "Verification code refreshed. Use the code shown in this environment to verify your Gmail account.",
        "dev_verification_code": None if delivered else verification_code,
    }


@router.get("/me")
def me(authorization: str = Header(default="")):
    token = authorization.replace("Bearer ", "")
    return build_public_user(authenticate_bearer(token))
