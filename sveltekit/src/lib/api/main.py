from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from contextlib import asynccontextmanager

from app.config.settings import settings
from app.db.database import create_db_and_tables # Import this function
from app.routers import user
from app.routers import auth as auth_router

import ssl

# Define the lifespan function
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

# Custom ID generator for OpenAPI docs
def custom_generate_unique_id(route: APIRoute):
    return f"{route.tags[0]}-{route.name}"

app = FastAPI(lifespan=lifespan, generate_unique_id_function=custom_generate_unique_id)

# CORS configuration - 確保 cookie 能正確傳遞
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,  # 這對 cookie 傳遞很重要
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ssl_context.load_cert_chain('/home/hung/fgcNote/src/lib/api/self.crt', keyfile='/home/hung/fgcNote/src/lib/api/self.key')

