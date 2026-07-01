from contextlib import asynccontextmanager
from collections import defaultdict, deque
import logging
import time

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from backend.database.init_db import initialize_database
from backend.routes.auth import router as auth_router
from backend.routes.chatbot import router as chatbot_router
from backend.routes.habits import router as habits_router
from backend.routes.simulation import router as simulation_router
from backend.routes.dream import router as dream_router
from backend.routes.reality import router as reality_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Life Outcome Simulator with AI Coach", version="1.0.0", lifespan=lifespan)
logger = logging.getLogger("life_outcome_api")
logging.basicConfig(level=logging.INFO)

RATE_LIMIT_REQUESTS = 120
RATE_LIMIT_WINDOW_SECONDS = 60
request_window = defaultdict(deque)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    bucket = request_window[client_ip]

    while bucket and now - bucket[0] > RATE_LIMIT_WINDOW_SECONDS:
        bucket.popleft()

    if len(bucket) >= RATE_LIMIT_REQUESTS:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please retry in a few moments."},
        )

    bucket.append(now)

    started = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info("%s %s -> %s (%.2fms)", request.method, request.url.path, response.status_code, elapsed_ms)
    return response

@app.get("/health")
def health():
    return {"status": "ok", "app": "Life Outcome Simulator with AI Coach"}


app.include_router(auth_router)
app.include_router(habits_router)
app.include_router(simulation_router)
app.include_router(chatbot_router)
app.include_router(dream_router)
app.include_router(reality_router)
