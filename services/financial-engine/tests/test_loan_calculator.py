"""
Pruebas unitarias para el calculador de préstamos.
Verifica la exactitud matemática de las fórmulas financieras.
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.loan_calculator import (
    calcular_cuota_mensual,
    calcular_prestamo_completo,
    generar_tabla_amortizacion,
    simular_pago_extra,
    calcular_tasa_mensual,
    _calcular_meses_para_liquidar,
)


class TestCalcularTasaMensual:
    def test_conversion_tasa_anual_a_mensual(self):
        """12% anual debe ser 1% mensual."""
        tasa = calcular_tasa_mensual(12.0)
        assert abs(tasa - 0.01) < 0.000001

    def test_tasa_cero(self):
        """Tasa 0% debe retornar 0."""
        assert calcular_tasa_mensual(0) == 0.0

    def test_tasa_alta(self):
        """Tasa 24% anual debe ser 2% mensual."""
        tasa = calcular_tasa_mensual(24.0)
        assert abs(tasa - 0.02) < 0.000001


class TestCalcularCuotaMensual:
    def test_prestamo_estandar(self):
        """$10,000 al 12% por 12 meses ≈ $888.49."""
        cuota = calcular_cuota_mensual(10000, 12, 12)
        assert abs(cuota - 888.49) < 1.0

    def test_tasa_cero(self):
        """Con tasa 0%, la cuota es exactamente capital/plazo."""
        cuota = calcular_cuota_mensual(12000, 0, 12)
        assert cuota == 1000.0

    def test_cuota_mayor_a_cero(self):
        """La cuota siempre debe ser positiva."""
        cuota = calcular_cuota_mensual(50000, 15, 24)
        assert cuota > 0

    def test_plazo_mayor_reduce_cuota(self):
        """A mayor plazo, menor cuota mensual."""
        cuota_12 = calcular_cuota_mensual(10000, 10, 12)
        cuota_24 = calcular_cuota_mensual(10000, 10, 24)
        assert cuota_24 < cuota_12

    def test_tasa_mayor_aumenta_cuota(self):
        """A mayor tasa, mayor cuota mensual."""
        cuota_baja = calcular_cuota_mensual(10000, 5, 12)
        cuota_alta = calcular_cuota_mensual(10000, 20, 12)
        assert cuota_alta > cuota_baja

    def test_total_pagado_mayor_al_capital(self):
        """El total pagado siempre debe superar el capital."""
        capital = 50000
        cuota = calcular_cuota_mensual(capital, 15, 24)
        total = cuota * 24
        assert total > capital

    def test_prestamo_hipotecario(self):
        """$500,000 al 9.5% por 240 meses debe estar en rango razonable."""
        cuota = calcular_cuota_mensual(500000, 9.5, 240)
        assert 4500 < cuota < 5500


class TestGenerarTablaAmortizacion:
    def setup_method(self):
        """Setup común para todos los tests."""
        self.tabla = generar_tabla_amortizacion(10000, 12, 12)

    def test_numero_correcto_de_filas(self):
        """La tabla debe tener exactamente plazo_meses filas."""
        assert len(self.tabla) == 12

    def test_primera_fila_tiene_campos_requeridos(self):
        """Cada fila debe tener todos los campos necesarios."""
        fila = self.tabla[0]
        assert "mes" in fila
        assert "cuota" in fila
        assert "capital" in fila
        assert "interes" in fila
        assert "saldo_pendiente" in fila
        assert "porcentaje_completado" in fila

    def test_saldo_final_es_cero(self):
        """El saldo al final del préstamo debe ser 0."""
        ultimo = self.tabla[-1]
        assert ultimo["saldo_pendiente"] == 0.0

    def test_suma_capital_igual_al_original(self):
        """La suma de todos los capitales debe ≈ capital inicial."""
        total_capital = sum(row["capital"] for row in self.tabla)
        assert abs(total_capital - 10000) < 1.0

    def test_interes_primer_mes_es_mayor(self):
        """El interés del primer mes debe ser mayor que el del último."""
        interes_primero = self.tabla[0]["interes"]
        interes_ultimo = self.tabla[-1]["interes"]
        assert interes_primero > interes_ultimo

    def test_saldo_decrece_con_el_tiempo(self):
        """El saldo pendiente debe decrecer cada mes."""
        saldos = [row["saldo_pendiente"] for row in self.tabla]
        for i in range(1, len(saldos)):
            assert saldos[i] <= saldos[i - 1]

    def test_porcentaje_completado_llega_a_100(self):
        """El porcentaje de completado debe llegar a 100% al final."""
        ultimo = self.tabla[-1]
        assert ultimo["porcentaje_completado"] == 100.0


class TestSimularPagoExtra:
    def test_pago_extra_15_por_ciento(self):
        """El clásico: 15% extra debe ahorrar intereses y reducir plazo."""
        resultado = simular_pago_extra(
            capital=100000,
            tasa_anual=12.0,
            plazo_meses=36,
            saldo_actual=100000,
            porcentaje_extra=15.0,
            pagos_realizados=0,
        )
        assert resultado["ahorro_total_intereses"] > 0
        assert resultado["meses_menos"] > 0
        assert resultado["pago_mensual_con_extra"] > resultado["cuota_base"]

    def test_mayor_porcentaje_mayor_ahorro(self):
        """A mayor % extra, mayor ahorro en intereses."""
        params = dict(capital=50000, tasa_anual=10, plazo_meses=24, saldo_actual=50000, pagos_realizados=0)
        resultado_10 = simular_pago_extra(**params, porcentaje_extra=10)
        resultado_30 = simular_pago_extra(**params, porcentaje_extra=30)
        assert resultado_30["ahorro_total_intereses"] > resultado_10["ahorro_total_intereses"]

    def test_saldo_actual_en_respuesta(self):
        """La respuesta debe incluir el saldo actual original."""
        resultado = simular_pago_extra(
            capital=10000, tasa_anual=12, plazo_meses=12,
            saldo_actual=7500, porcentaje_extra=20, pagos_realizados=3
        )
        assert resultado["saldo_actual"] == 7500

    def test_nueva_fecha_es_anterior_a_original(self):
        """La nueva fecha de liquidación debe ser anterior a la original."""
        resultado = simular_pago_extra(
            capital=20000, tasa_anual=18, plazo_meses=24,
            saldo_actual=20000, porcentaje_extra=25, pagos_realizados=0
        )
        from datetime import date
        nueva = date.fromisoformat(resultado["nueva_fecha_liquidacion"])
        original = date.fromisoformat(resultado["fecha_liquidacion_original"])
        assert nueva < original

    def test_datos_desglose_presentes(self):
        """El desglose debe contener los campos necesarios."""
        resultado = simular_pago_extra(10000, 10, 12, 10000, 10, 0)
        desglose = resultado["desglose_por_mes"]
        assert "intereses_sin_extra" in desglose
        assert "intereses_con_extra" in desglose
        assert "ahorro_porcentual" in desglose


class TestCalculoPrestamoCompleto:
    def test_retorna_todas_las_metricas(self):
        """El resultado debe incluir todas las métricas necesarias."""
        resultado = calcular_prestamo_completo(10000, 12, 12)
        assert "cuota_mensual" in resultado
        assert "total_pagado" in resultado
        assert "total_intereses" in resultado
        assert "tasa_mensual" in resultado
        assert "tabla_resumen" in resultado

    def test_total_pagado_es_cuota_por_plazo(self):
        """Total pagado ≈ cuota mensual × plazo (con ajuste de redondeo)."""
        resultado = calcular_prestamo_completo(10000, 12, 12)
        esperado = resultado["cuota_mensual"] * 12
        assert abs(resultado["total_pagado"] - esperado) < 1.0
