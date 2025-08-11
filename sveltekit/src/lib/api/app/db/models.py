from sqlmodel import SQLModel, Field, Column, DateTime, ForeignKey, Relationship, UniqueConstraint

from sqlalchemy import func, event, Enum as SQLEnum
from sqlalchemy.orm import Mapper
from datetime import datetime
from uuid import UUID, uuid4 # Import uuid4
from enum import Enum
import os


class UserBase(SQLModel):
    """
        只接受用Google帳戶登錄
    """
    email: str = Field(unique=True, index=True, nullable=False)
    name: str = Field(nullable=False)
    picture: str | None = Field(default=None)  # Google 頭像
    google_sub: str = Field(unique=True, index=True, nullable=False)  # Google 用戶唯一 ID

class User(UserBase, table= True):
    # Change: Use default_factory=uuid4 for automatic UUID generation
    # Also, remove '| None' from UUID type hint for primary key when using default_factory
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    nickname: str | None = Field(default=None)
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime, server_default=func.now())
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime, server_default=func.now(), onupdate=func.now())
    )

class UserPublic(UserBase):
    name: str
    picture: str | None
    created_at: datetime
    updated_at: datetime

class UserCreate(UserBase):
    pass
