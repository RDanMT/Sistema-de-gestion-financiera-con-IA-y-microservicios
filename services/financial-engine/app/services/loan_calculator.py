"""
Servicio de cálculos financieros — Fórmulas de amortización francesa
Todas las funciones son puras (sin efectos secundarios) para facilitar testing.
"""
from typing import List, Dict, Any
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
import math


def calcular_tasa_mensual(tasa_anual: float) -> float:
    """Convierte tasa anual porcentual a tasa mensual decimal."""
    return tasa_anual / 100 / 12


def calcular_cuota_mensual(capital: float, tasa_anual: float, plazo_meses: int) -> float:
    """
    Fórmula de cuota fija (Sistema Francés):
    C = P * [r(1+r)^n] / [(1+r)^n - 1]
    donde r = tasa mensual, n = número de cuotas
    """
    if tasa_anual == 0:
        return round(capital / plazo_meses, 2)

    r = calcular_tasa_mensual(tasa_anual)
    factor = math.pow(1 + r, plazo_meses)
    cuota = capital * (r * factor) / (factor - 1)
    return round(cuota, 2)


def generar_tabla_amortizacion(
    capital: float,
    tasa_anual: float,
    plazo_meses: int,
    fecha_inicio: date = None,
) -> List[Dict[str, Any]]:
    """
    Genera la tabla de amortización completa (sistema francés).
    Retorna lista de filas con capital, interés y saldo por mes.
    """
    if fecha_inicio is None:
        fecha_inicio = date.today()

    r = calcular_tasa_mensual(tasa_anual)
    cuota = calcular_cuota_mensual(capital, tasa_anual, plazo_meses)
    saldo = capital
    tabla = []

    for mes in range(1, plazo_meses + 1):
        interes = round(saldo * r, 2)
        capital_mes = round(min(cuota - interes, saldo), 2)

        # Ajuste para último pago
        if mes == plazo_meses:
            capital_mes = round(saldo, 2)
            cuota_mes = round(capital_mes + interes, 2)
        else:
            cuota_mes = cuota

        saldo_nuevo = round(max(0, saldo - capital_mes), 2)
        fecha_pago = fecha_inicio + relativedelta(months=mes)

        tabla.append({
            "mes": mes,
            "fecha": fecha_pago.isoformat(),
            "cuota": cuota_mes,
            "capital": capital_mes,
            "interes": interes,
            "saldo_pendiente": saldo_nuevo,
            "porcentaje_completado": round((1 - saldo_nuevo / capital) * 100, 2),
        })

        saldo = saldo_nuevo
        if saldo <= 0:
            break

    return tabla


def calcular_prestamo_completo(
    capital: float, tasa_anual: float, plazo_meses: int
) -> Dict[str, Any]:
    """
    Calcula métricas completas de un préstamo.
    """
    cuota = calcular_cuota_mensual(capital, tasa_anual, plazo_meses)
    total_pagado = round(cuota * plazo_meses, 2)
    total_intereses = round(total_pagado - capital, 2)
    r = calcular_tasa_mensual(tasa_anual)

    return {
        "cuota_mensual": cuota,
        "total_pagado": total_pagado,
        "total_intereses": total_intereses,
        "tasa_mensual": round(r * 100, 4),
        "tabla_resumen": {
            "primer_mes_interes": round(capital * r, 2),
            "primer_mes_capital": round(cuota - capital * r, 2),
            "relacion_interes_capital": round(total_intereses / capital * 100, 2),
        },
    }


def simular_pago_extra(
    capital: float,
    tasa_anual: float,
    plazo_meses: int,
    saldo_actual: float,
    porcentaje_extra: float,
    pagos_realizados: int = 0,
) -> Dict[str, Any]:
    """
    Simula el impacto de pagar un % extra sobre la cuota mensual.
    Calcula: ahorro en intereses, meses menos, nueva fecha de liquidación.
    
    Returns:
        Dict con análisis completo del beneficio del pago extra
    """
    cuota_base = calcular_cuota_mensual(capital, tasa_anual, plazo_meses)
    monto_extra = round(cuota_base * (porcentaje_extra / 100), 2)
    cuota_con_extra = round(cuota_base + monto_extra, 2)
    r = calcular_tasa_mensual(tasa_anual)

    # Calcular intereses totales sin pago extra (meses restantes)
    meses_restantes_original = plazo_meses - pagos_realizados
    intereses_sin_extra = _calcular_intereses_totales(saldo_actual, r, meses_restantes_original, cuota_base)

    # Calcular intereses totales con pago extra
    meses_con_extra = _calcular_meses_para_liquidar(saldo_actual, r, cuota_con_extra)
    intereses_con_extra = _calcular_intereses_totales(saldo_actual, r, meses_con_extra, cuota_con_extra)

    ahorro = round(intereses_sin_extra - intereses_con_extra, 2)
    meses_menos = meses_restantes_original - meses_con_extra

    fecha_actual = date.today()
    fecha_liquidacion_original = fecha_actual + relativedelta(months=meses_restantes_original)
    fecha_liquidacion_nueva = fecha_actual + relativedelta(months=meses_con_extra)

    return {
        "porcentaje_extra": porcentaje_extra,
        "cuota_base": cuota_base,
        "monto_extra_mensual": monto_extra,
        "pago_mensual_con_extra": cuota_con_extra,
        "ahorro_total_intereses": ahorro,
        "meses_menos": meses_menos,
        "meses_restantes_original": meses_restantes_original,
        "meses_restantes_con_extra": meses_con_extra,
        "fecha_liquidacion_original": fecha_liquidacion_original.isoformat(),
        "nueva_fecha_liquidacion": fecha_liquidacion_nueva.isoformat(),
        "saldo_actual": saldo_actual,
        "desglose_por_mes": {
            "intereses_sin_extra": round(intereses_sin_extra, 2),
            "intereses_con_extra": round(intereses_con_extra, 2),
            "ahorro_porcentual": round((ahorro / intereses_sin_extra * 100) if intereses_sin_extra > 0 else 0, 2),
        },
    }


def _calcular_intereses_totales(
    saldo: float, tasa_mensual: float, meses: int, cuota: float
) -> float:
    """Calcula intereses totales para un número dado de meses."""
    total_interes = 0.0
    s = saldo
    for _ in range(int(meses)):
        if s <= 0:
            break
        interes = s * tasa_mensual
        total_interes += interes
        capital = min(cuota - interes, s)
        s = max(0, s - capital)
    return round(total_interes, 2)


def _calcular_meses_para_liquidar(
    saldo: float, tasa_mensual: float, cuota: float
) -> int:
    """Calcula cuántos meses se necesitan para liquidar con cuota dada."""
    if tasa_mensual == 0:
        return math.ceil(saldo / cuota)

    s = saldo
    meses = 0
    while s > 0.01 and meses < 600:
        interes = s * tasa_mensual
        capital = cuota - interes
        if capital <= 0:
            return 600  # Préstamo impagable
        s = max(0, s - capital)
        meses += 1
    return meses
