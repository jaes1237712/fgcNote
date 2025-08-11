from fastapi import APIRouter, Depends, Response, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session
from app.db.database import get_session, create_or_get_user_from_google
from app.services.fedcmAPI import verify_google_token, create_session_jwt
from app.config.settings import settings


class GoogleLoginBody(BaseModel):
    id_token: str


router = APIRouter()


@router.post("/google-login")
async def google_login(body: GoogleLoginBody, response: Response, session: Session = Depends(get_session)):
    try:
        user_info = verify_google_token(body.id_token)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    user = create_or_get_user_from_google(user_info, session)
    session_jwt = create_session_jwt(str(user.id))
    
    # 根據環境調整 cookie 設置
    is_development = "localhost" in settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else True
    
    response.set_cookie(
        key="session",
        value=session_jwt,
        httponly=True,
        secure=not is_development,  # 開發環境設為 False
        samesite="lax" if is_development else "none",  # 開發環境使用 lax
        path="/",
        max_age=60 * 60 * 24 * 7,
    )
    return True


