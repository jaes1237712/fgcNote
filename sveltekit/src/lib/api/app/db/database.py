from sqlmodel import create_engine, Session, SQLModel, text, select
from typing import Annotated
from app.config.settings import settings
from fastapi import HTTPException, Depends, status, Request
from app.db.models import User
from app.services.fedcmAPI import verify_google_token, verify_session_jwt, create_session_jwt
from uuid import UUID


# Use settings for the database URL
engine = create_engine(settings.SQLITE_DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    with engine.connect() as connection:
        connection.execute(text("PRAGMA foreign_keys=ON"))
    print("Database tables created/checked.")

def get_session():
    with Session(engine) as session:
        yield session

async def get_current_user(
    request: Request,
    session: Session = Depends(get_session)) -> User:
    session_token = request.cookies.get("session")
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing session cookie")
    try:
        payload = verify_session_jwt(session_token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session payload")
        # 將字符串 user_id 轉換為 UUID 對象
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID format")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    
    user = session.get(User, user_uuid)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def create_or_get_user_from_google(user_info: dict, session: Session) -> User:
    user = session.exec(select(User).where(User.google_sub == user_info["sub"])).first()
    if not user:
        user = User(
            email=user_info["email"],
            name=user_info["name"],
            picture=user_info.get("picture"),
            google_sub=user_info["sub"]
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    return user