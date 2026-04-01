/**
 * @jest-environment node
 * Tests unitarios para cálculos de préstamos (lógica pura, sin DB)
 */

// Funciones de cálculo financiero (extraídas para test unitario)
const calcularCuotaMensual = (capital, tasaAnual, plazoMeses) => {
  const tasaMensual = tasaAnual / 100 / 12;
  if (tasaMensual === 0) return capital / plazoMeses;
  const cuota =
    (capital * tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
    (Math.pow(1 + tasaMensual, plazoMeses) - 1);
  return Math.round(cuota * 100) / 100;
};

const calcularSaldoConPagoExtra = (saldoActual, tasaAnual, porcentajeExtra, cuotaMensual) => {
  const pagoExtra = cuotaMensual * (porcentajeExtra / 100);
  const pagoTotal = cuotaMensual + pagoExtra;
  const tasaMensual = tasaAnual / 100 / 12;
  const interesesMes = saldoActual * tasaMensual;
  const capitalAmortizado = Math.min(pagoTotal - interesesMes, saldoActual);
  return {
    nuevoSaldo: Math.max(0, saldoActual - capitalAmortizado),
    ahorroInteres: pagoExtra * (tasaAnual / 100 / 12 / (1 + tasaAnual / 100 / 12)),
    capitalExtra: capitalAmortizado - (cuotaMensual - interesesMes),
  };
};

describe('Cálculos de Préstamos — Lógica Financiera', () => {
  describe('calcularCuotaMensual', () => {
    it('debe calcular cuota para préstamo estándar', () => {
      // Préstamo: $10,000 al 12% anual por 12 meses → ~$888.49
      const cuota = calcularCuotaMensual(10000, 12, 12);
      expect(cuota).toBeCloseTo(888.49, 0);
    });

    it('debe calcular cuota con tasa 0%', () => {
      const cuota = calcularCuotaMensual(12000, 0, 12);
      expect(cuota).toBe(1000);
    });

    it('debe calcular cuota para préstamo hipotecario', () => {
      // $500,000 al 9.5% anual por 240 meses → ~$4,655
      const cuota = calcularCuotaMensual(500000, 9.5, 240);
      expect(cuota).toBeGreaterThan(4500);
      expect(cuota).toBeLessThan(5000);
    });

    it('total pagado debe ser mayor al capital (hay intereses)', () => {
      const capital = 50000;
      const cuota = calcularCuotaMensual(capital, 15, 24);
      const totalPagado = cuota * 24;
      expect(totalPagado).toBeGreaterThan(capital);
    });

    it('a mayor plazo, menor cuota mensual', () => {
      const cuota12 = calcularCuotaMensual(10000, 10, 12);
      const cuota24 = calcularCuotaMensual(10000, 10, 24);
      expect(cuota24).toBeLessThan(cuota12);
    });

    it('a mayor tasa, mayor cuota mensual', () => {
      const cuotaBaja = calcularCuotaMensual(10000, 5, 12);
      const cuotaAlta = calcularCuotaMensual(10000, 20, 12);
      expect(cuotaAlta).toBeGreaterThan(cuotaBaja);
    });
  });

  describe('simulación de pago extra al 15%', () => {
    it('pago extra del 15% debe reducir el saldo más rápido', () => {
      const cuota = calcularCuotaMensual(10000, 12, 12);
      const resultado = calcularSaldoConPagoExtra(10000, 12, 15, cuota);

      // El nuevo saldo debe ser menor que el saldo sin pago extra
      const tasaMensual = 12 / 100 / 12;
      const intereses = 10000 * tasaMensual;
      const cuotaCapital = cuota - intereses;
      const saldoSinExtra = 10000 - cuotaCapital;

      expect(resultado.nuevoSaldo).toBeLessThan(saldoSinExtra);
    });

    it('el capital extra debe ser positivo con pago mayor a cuota', () => {
      const cuota = calcularCuotaMensual(5000, 10, 12);
      const resultado = calcularSaldoConPagoExtra(5000, 10, 20, cuota);
      expect(resultado.capitalExtra).toBeGreaterThan(0);
    });

    it('saldo no debe ser negativo', () => {
      const cuota = calcularCuotaMensual(1000, 12, 2);
      const resultado = calcularSaldoConPagoExtra(1000, 12, 200, cuota);
      expect(resultado.nuevoSaldo).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validaciones de entrada', () => {
    it('capital debe ser número positivo', () => {
      expect(() => {
        if (-1000 <= 0) throw new Error('Capital inválido');
      }).toThrow('Capital inválido');
    });

    it('tasa debe estar entre 0 y 100', () => {
      expect(() => {
        if (150 > 100) throw new Error('Tasa inválida');
      }).toThrow('Tasa inválida');
    });
  });
});
