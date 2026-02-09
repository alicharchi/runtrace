from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.app_config import CONFIG
from app.database import init_db, engine
from app.models.user import User
from app.utils.auth import hash_password
from app.routers import runs, events, runinfo, parameters, login, health, users


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
    app.include_router(parameters.router)
    app.include_router(login.router)
    app.include_router(users.router)

    return app


app = create_app()


@app.on_event("startup")
def on_startup():
    init_db()

    admin_email = CONFIG.ADMIN_EMAIL
    admin_password = CONFIG.ADMIN_PASSWORD
    
    if len(admin_password.encode("utf-8")) > 72:
        raise RuntimeError(
            "ADMIN_PASSWORD must be 72 bytes or fewer (bcrypt limit)"
        )

    with Session(engine) as session:
        existing_admin = session.exec(
            select(User).where(User.email == admin_email)
        ).first()

        if not existing_admin:
            admin = User(
                email=admin_email,
                first_name="Admin",
                last_name="User",
                password=hash_password(admin_password),
                is_superuser=True,
                is_active=True,
            )
            session.add(admin)
            session.commit()
            print(f"Admin user created: {admin_email}")
        else:
            print("Admin user already exists")
