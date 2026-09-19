import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="EchoMind",
    version="1.0.0",
    description=(
        "AI-powered conversational assistant using "
        "context-aware AI, conversation memory, and web search."
    ),
)


# =========================================================
# CORS
# =========================================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    origins.append(frontend_url)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTES
# =========================================================

app.include_router(auth_router)
app.include_router(chat_router)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
async def root():
    return {
        "status": "OK",
        "message": "EchoMind API is running",
    }