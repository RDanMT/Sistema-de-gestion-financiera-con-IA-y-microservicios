"""
Servicio LLM — Integración estrictamente parametrizada con datos financieros reales.
El prompt garantiza que el LLM SOLO responda con datos del contexto proporcionado.
"""
import json
from typing import Dict, Any, Optional
from app.core.config import settings

# ──────────────────────────────────────────────────────────────
# PROMPT SISTEMA — Contexto estrictamente financiero
# ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT_TEMPLATE = """Eres un asesor financiero personal altamente especializado llamado "FinBot".

REGLAS ESTRICTAS (NO las violes bajo ninguna circunstancia):
1. SOLO responde usando los datos financieros proporcionados en <CONTEXTO_FINANCIERO>.
2. Si la pregunta no puede responderse con los datos disponibles, di exactamente: "No tengo suficientes datos financieros para responder esa consulta."
3. NUNCA inventes cifras, tasas, fechas o montos que no estén en el contexto.
4. NUNCA respondas preguntas fuera del dominio financiero (política, entretenimiento, etc.).
5. Siempre incluye los cálculos numéricos específicos en tu respuesta.
6. Usa el nombre del usuario de forma amigable.
7. Expresa montos con 2 decimales y moneda MXN por defecto.
8. Si el usuario pregunta sobre pagar extra, calcula exactamente cuánto ahorra basándote en los datos reales.

<CONTEXTO_FINANCIERO>
Usuario: {usuario_nombre}
Fecha de consulta: {fecha_actual}

{prestamos_info}

{gastos_info}
</CONTEXTO_FINANCIERO>

Responde en español, de forma concisa, precisa y con orientación práctica. Máximo 200 palabras."""


def _format_loan_info(prestamos: list) -> str:
    """Formatea la info de préstamos para el prompt."""
    if not prestamos:
        return "PRÉSTAMOS ACTIVOS: Ninguno registrado"

    lines = ["PRÉSTAMOS ACTIVOS:"]
    for p in prestamos:
        lines.append(f"""
  - Préstamo: {p.get('nombre', 'Sin nombre')}
    Capital inicial: ${p.get('capital_inicial', 0):,.2f}
    Saldo actual: ${p.get('saldo_actual', 0):,.2f}
    Tasa anual: {p.get('tasa_anual', 0)}%
    Tasa mensual: {round(p.get('tasa_anual', 0) / 12, 4)}%
    Plazo total: {p.get('plazo_meses', 0)} meses
    Cuota mensual: ${p.get('cuota_mensual', 0):,.2f}
    Pagos realizados: {p.get('pagos_realizados', 0)}
    Intereses pagados: ${p.get('total_intereses_pagados', 0):,.2f}""")

    return "\n".join(lines)


def _format_spending_info(gastos_por_categoria: dict, total_gastos: float, total_ingresos: float) -> str:
    """Formatea la info de gastos para el prompt."""
    if not gastos_por_categoria:
        return "GASTOS RECIENTES: Sin datos de gastos"

    lines = [f"GASTOS RECIENTES (últimas 30 transacciones):"]
    lines.append(f"  Total gastos: ${total_gastos:,.2f}")
    lines.append(f"  Total ingresos: ${total_ingresos:,.2f}")
    lines.append(f"  Balance: ${(total_ingresos - total_gastos):,.2f}")
    lines.append("  Por categoría:")
    for cat, monto in sorted(gastos_por_categoria.items(), key=lambda x: x[1], reverse=True):
        lines.append(f"    - {cat}: ${monto:,.2f}")

    return "\n".join(lines)


async def generate_financial_response(
    pregunta: str,
    contexto_financiero: Dict[str, Any],
    usuario_nombre: str = "Usuario",
) -> Dict[str, Any]:
    """
    Genera una respuesta del LLM estrictamente basada en el contexto financiero.
    """
    from datetime import date

    # Preparar el prompt con contexto real
    prestamos_info = _format_loan_info(
        contexto_financiero.get("prestamos_activos", [])
    )

    # Si hay préstamo específico, añadirlo primero
    if contexto_financiero.get("prestamo_especifico"):
        p = contexto_financiero["prestamo_especifico"]
        prestamos_info = f"""PRÉSTAMO CONSULTADO ESPECÍFICAMENTE:
  - {p.get('nombre')}: ${p.get('capital_inicial', 0):,.2f} al {p.get('tasa_anual')}% anual
  - Saldo actual: ${p.get('saldo_actual', 0):,.2f}
  - Cuota mensual: ${p.get('cuota_mensual', 0):,.2f}

""" + prestamos_info

    gastos_info = _format_spending_info(
        contexto_financiero.get("gastos_por_categoria", {}),
        contexto_financiero.get("total_gastos_recientes", 0),
        contexto_financiero.get("total_ingresos_recientes", 0),
    )

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        usuario_nombre=usuario_nombre,
        fecha_actual=date.today().isoformat(),
        prestamos_info=prestamos_info,
        gastos_info=gastos_info,
    )

    # Llamar al proveedor configurado
    if settings.llm_provider == "ollama":
        respuesta = await _call_ollama(system_prompt, pregunta)
    else:
        respuesta = await _call_openai(system_prompt, pregunta)

    return {
        "respuesta": respuesta,
        "contexto_usado": {
            "prestamos": len(contexto_financiero.get("prestamos_activos", [])),
            "transacciones": len(contexto_financiero.get("gastos_por_categoria", {})),
        },
        "modelo": settings.llm_model,
        "proveedor": settings.llm_provider,
    }


async def _call_ollama(system_prompt: str, user_message: str) -> str:
    """Llama a Ollama con el prompt parametrizado."""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.llm_base_url}/api/chat",
                json={
                    "model": settings.llm_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "stream": False,
                    "options": {
                        "temperature": 0.3,  # Bajo para respuestas más deterministas
                        "top_p": 0.9,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
    except Exception as e:
        return f"Error al conectar con el modelo de IA: {str(e)}. Verifica que Ollama esté corriendo con: ollama serve"


async def _call_openai(system_prompt: str, user_message: str) -> str:
    """Llama a OpenAI API con el prompt parametrizado."""
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=400,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error con OpenAI API: {str(e)}"
