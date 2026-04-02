from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.api.routes import loans, ai_chat

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("financial-engine")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Financial Engine iniciando — LLM: {settings.llm_provider}/{settings.llm_model}")
    yield
    logger.info("Financial Engine detenido")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="""
    ## Motor Financiero — Microservicio de Cálculos y IA
    
    Proporciona:
    - **Cálculos de préstamos**: amortización francesa, proyecciones
    - **Simulaciones**: impacto de pagos extra
    - **IA financiera**: consultas basadas en datos reales del usuario
    """,
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url="/redoc" if settings.environment == "development" else None,
    lifespan=lifespan,
)

# CORS — Permitir tráfico en la nube entre servicios (Render a Render)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health", tags=["system"])
async def health():
    return {
        "status": "ok",
        "service": "financial-engine",
        "version": settings.version,
        "llm_provider": settings.llm_provider,
        "llm_model": settings.llm_model,
    }

# Registrar rutas
app.include_router(loans.router)
app.include_router(ai_chat.router)
