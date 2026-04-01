from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.llm_service import generate_financial_response

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ChatRequest(BaseModel):
    pregunta: str
    contexto_financiero: Dict[str, Any]
    usuario_nombre: str = "Usuario"


@router.post("/chat", summary="Consulta financiera con IA")
async def ai_chat(request: ChatRequest):
    """
    Responde preguntas financieras basándose EXCLUSIVAMENTE en datos reales del usuario.
    Ejemplo: '¿Cuánto ahorro si pago 15% extra a mi préstamo este mes?'
    """
    if not request.pregunta.strip():
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía")

    if len(request.pregunta) > 500:
        raise HTTPException(status_code=400, detail="Pregunta demasiado larga (máx 500 caracteres)")

    resultado = await generate_financial_response(
        pregunta=request.pregunta,
        contexto_financiero=request.contexto_financiero,
        usuario_nombre=request.usuario_nombre,
    )

    return resultado
