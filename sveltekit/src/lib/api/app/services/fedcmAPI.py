from google.oauth2 import id_token
from google.auth.transport import requests
from ..config.settings import settings
from datetime import datetime, timedelta, timezone
import jwt

def verify_google_token(token: str) -> dict:
    """
    驗證 Google id_token 並回傳 user info dict
    """
    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.CLIENT_ID)
        # idinfo 會包含 sub, email, name, picture 等
        return {
            "sub": idinfo["sub"],
            "email": idinfo["email"],
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
        }
    except Exception as e:
        raise Exception(f"Invalid token: {e}")

def create_session_jwt(user_id: str) -> str:
    """
    以伺服器的密鑰簽發自有的 Session JWT，payload 僅包含我們的 user_id
    """
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "iss": "fgcNote",
        "typ": "sess"
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    # PyJWT may return bytes in older versions; ensure string
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token

def verify_session_jwt(token: str) -> dict:
    """
    驗證我們自有的 Session JWT，回傳 payload
    """
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception as e:
        raise Exception(f"Invalid session token: {e}")

