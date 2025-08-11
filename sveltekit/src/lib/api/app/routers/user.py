from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.database import get_current_user, get_session
from app.db.models import User, UserPublic

router = APIRouter()

@router.get("/me", response_model=UserPublic)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/search/{email}", response_model=bool)
async def is_you_there(
    email: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)):    
    target_user = session.exec(select(User).where(User.email == email)).one_or_none()
    if(target_user):
        return True
    return False
