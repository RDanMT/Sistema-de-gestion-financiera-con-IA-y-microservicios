from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date


class LoanCalculateRequest(BaseModel):
    capital: float = Field(..., gt=0, description="Capital del préstamo")
    tasa_anual: float = Field(..., ge=0, le=100, description="Tasa de interés anual (%)")
    plazo_meses: int = Field(..., ge=1, le=600, description="Plazo en meses")

    @field_validator("capital")
    @classmethod
    def capital_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("El capital debe ser mayor a 0")
        return round(v, 2)


class AmortizationRequest(BaseModel):
    capital: float = Field(..., gt=0)
    tasa_anual: float = Field(..., ge=0, le=100)
    plazo_meses: int = Field(..., ge=1)
    pagos_realizados: int = Field(0, ge=0)


class ExtraPaymentRequest(BaseModel):
    capital: float = Field(..., gt=0)
    tasa_anual: float = Field(..., ge=0, le=100)
    plazo_meses: int = Field(..., ge=1)
    saldo_actual: float = Field(..., ge=0)
    porcentaje_extra: float = Field(..., ge=0.1, le=100)
    pagos_realizados: int = Field(0, ge=0)


class AmortizationRow(BaseModel):
    mes: int
    cuota: float
    capital: float
    interes: float
    saldo_pendiente: float
    porcentaje_completado: float


class LoanCalculateResponse(BaseModel):
    cuota_mensual: float
    total_pagado: float
    total_intereses: float
    tasa_mensual: float
    tabla_resumen: dict


class ExtraPaymentResponse(BaseModel):
    porcentaje_extra: float
    pago_mensual_con_extra: float
    ahorro_total_intereses: float
    meses_menos: int
    nueva_fecha_liquidacion: str
    saldo_actual: float
    desglose_por_mes: dict
