from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.app_config import CONFIG
from app.database import init_db
from app.routers import runs, events, runinfo, health

def create_app() -> FastAPI:
    app = FastAPI(title="Run Logging API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=CONFIG.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(runs.router)
    app.include_router(events.router)
    app.include_router(runinfo.router)

    return app

app = create_app()

@app.on_event("startup")
def on_startup():
    init_db()
