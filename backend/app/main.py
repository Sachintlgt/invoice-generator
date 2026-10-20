from contextlib import asynccontextmanager
import traceback
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api.invoices import router as invoices_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables are created if running directly without alembic
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[Startup Warning] Could not auto-create tables: {e}")
    yield


app = FastAPI(
    title="Invoice Studio API",
    description="Professional Invoice Management API for Small Business",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_trace = traceback.format_exc()
    print(f"[ERROR 500] {request.method} {request.url}: {exc}\n{err_trace}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )


app.include_router(invoices_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "invoice-studio-backend",
        "version": "1.0.0",
    }

