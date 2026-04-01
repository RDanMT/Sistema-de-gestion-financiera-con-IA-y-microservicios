from pydantic_settings import BaseSettings
from typing import Literal
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # App
    app_name: str = "Financial Engine — Microservicio"
    version: str = "1.0.0"
    environment: str = os.getenv("ENVIRONMENT", "development")

    # Server
    host: str = os.getenv("FASTAPI_HOST", "0.0.0.0")
    port: int = int(os.getenv("FASTAPI_PORT", "8000"))

    # LLM
    llm_provider: Literal["ollama", "openai"] = os.getenv("LLM_PROVIDER", "ollama")
    llm_model: str = os.getenv("LLM_MODEL", "llama3.2:3b")
    llm_base_url: str = os.getenv("LLM_BASE_URL", "http://localhost:11434")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")

    # Seguridad interna
    bff_internal_key: str = os.getenv("BFF_INTERNAL_KEY", "")

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
