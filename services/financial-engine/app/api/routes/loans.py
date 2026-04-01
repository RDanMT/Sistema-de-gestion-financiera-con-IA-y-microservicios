from fastapi import APIRouter, HTTPException
from app.models.loan_models import (
    LoanCalculateRequest,
    AmortizationRequest,
    ExtraPaymentRequest,
    LoanCalculateResponse,
    ExtraPaymentResponse,
)
from app.services.loan_calculator import (
    calcular_prestamo_completo,
    generar_tabla_amortizacion,
    simular_pago_extra,
)

router = APIRouter(prefix="/api/loans", tags=["loans"])


@router.post("/calculate", summary="Calcular métricas de préstamo")
async def calculate_loan(request: LoanCalculateRequest):
    """Calcula cuota mensual, total de intereses y resumen del préstamo."""
    try:
        resultado = calcular_prestamo_completo(
            capital=request.capital,
            tasa_anual=request.tasa_anual,
            plazo_meses=request.plazo_meses,
        )
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/amortization", summary="Tabla de amortización completa")
async def get_amortization_table(request: AmortizationRequest):
    """Genera la tabla de amortización mes a mes (sistema francés)."""
    try:
        tabla = generar_tabla_amortizacion(
            capital=request.capital,
            tasa_anual=request.tasa_anual,
            plazo_meses=request.plazo_meses,
        )
        # Si hay pagos realizados, marcar los completados
        for row in tabla:
            row["completado"] = row["mes"] <= request.pagos_realizados

        total_intereses = sum(r["interes"] for r in tabla)
        return {
            "tabla": tabla,
            "total_meses": len(tabla),
            "total_intereses": round(total_intereses, 2),
            "pagos_realizados": request.pagos_realizados,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate-extra-payment", summary="Simular pago extra")
async def simulate_extra_payment(request: ExtraPaymentRequest):
    """
    Simula el impacto de pagar un porcentaje extra sobre la cuota base.
    Responde: '¿Cuánto ahorro si pago un 15% extra este mes?'
    """
    try:
        resultado = simular_pago_extra(
            capital=request.capital,
            tasa_anual=request.tasa_anual,
            plazo_meses=request.plazo_meses,
            saldo_actual=request.saldo_actual,
            porcentaje_extra=request.porcentaje_extra,
            pagos_realizados=request.pagos_realizados,
        )
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
