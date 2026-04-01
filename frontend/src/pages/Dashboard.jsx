import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { useAuthStore } from '../store/authStore';
import { TrendingUp, TrendingDown, CreditCard, DollarSign, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler);

const CATEGORY_COLORS = {
  alimentacion: '#f59e0b', transporte: '#3b82f6', vivienda: '#8b5cf6',
  salud: '#10b981', entretenimiento: '#ef4444', educacion: '#06b6d4',
  ropa: '#ec4899', servicios: '#84cc16', otro: '#6b7280',
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const { loans, transactions, summary, fetchLoans, fetchTransactions, fetchSummary } = useFinanceStore();
  const [loadingDone, setLoadingDone] = useState(false);

  useEffect(() => {
    const now = new Date();
    Promise.all([
      fetchLoans(),
      fetchTransactions({ limit: 10 }),
      fetchSummary(now.getMonth() + 1, now.getFullYear()),
    ]).then(() => setLoadingDone(true));
  }, []);

  // Métricas del resumen
  const totalGastos = summary?.find((s) => s._id === 'gasto')?.totalGeneral || 0;
  const totalIngresos = summary?.find((s) => s._id === 'ingreso')?.totalGeneral || 0;
  const balance = totalIngresos - totalGastos;
  const activeLoan = loans.find((l) => l.estado === 'activo');
  const totalDeuda = loans.filter((l) => l.estado === 'activo').reduce((s, l) => s + (l.saldoActual || 0), 0);

  // Datos para gráfico de gastos por categoría
  const gastosCategorias = summary?.find((s) => s._id === 'gasto')?.categorias || [];
  const donutData = {
    labels: gastosCategorias.map((c) => c.categoria),
    datasets: [{
      data: gastosCategorias.map((c) => c.total),
      backgroundColor: gastosCategorias.map((c) => CATEGORY_COLORS[c.categoria] || '#6b7280'),
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  // Datos para gráfico de barras ingresos vs gastos
  const barData = {
    labels: ['Ingresos', 'Gastos'],
    datasets: [{
      data: [totalIngresos, totalGastos],
      backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(239,68,68,0.7)'],
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` $${ctx.parsed.y?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || ctx.parsed.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: (v) => `$${(v/1000).toFixed(0)}k` } },
    },
  };

  const donutOptions = {
    responsive: true,
    cutout: '72%',
    plugins: {
      legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 12 }, boxWidth: 12, padding: 12 } },
      tooltip: { backgroundColor: 'rgba(17,24,39,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 },
    },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Buenos días, {user?.nombre?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })} • Resumen del mes
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/transactions" className="btn btn-outline btn-sm">
            <Plus size={14} /> Agregar Gasto
          </Link>
          <Link to="/ai-chat" className="btn btn-gold btn-sm">
            🤖 Consultar IA
          </Link>
        </div>
      </div>

      <div className="page-container">
        {/* Métricas principales */}
        <div className="metric-grid mb-6">
          <div className="metric-card">
            <div className="metric-icon green"><TrendingUp size={20} /></div>
            <div className="metric-label">Ingresos del Mes</div>
            <div className="metric-value green">${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="metric-card danger">
            <div className="metric-icon red"><TrendingDown size={20} /></div>
            <div className="metric-label">Gastos del Mes</div>
            <div className="metric-value red">${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className={`metric-card ${balance >= 0 ? '' : 'danger'}`}>
            <div className="metric-icon blue"><DollarSign size={20} /></div>
            <div className="metric-label">Balance</div>
            <div className={`metric-value ${balance >= 0 ? 'green' : 'red'}`}>
              {balance >= 0 ? '+' : ''}${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="metric-card gold">
            <div className="metric-icon gold"><CreditCard size={20} /></div>
            <div className="metric-label">Deuda Total</div>
            <div className="metric-value gold">${totalDeuda.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid-2 mb-6">
          <div className="card">
            <div className="section-title">📊 Ingresos vs Gastos</div>
            <Bar data={barData} options={chartOptions} height={200} />
          </div>
          <div className="card">
            <div className="section-title">🍩 Gastos por Categoría</div>
            {gastosCategorias.length > 0 ? (
              <Doughnut data={donutData} options={donutOptions} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Sin datos de gastos este mes
              </div>
            )}
          </div>
        </div>

        {/* Préstamo activo + Transacciones recientes */}
        <div className="grid-2">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <div className="section-title" style={{ margin: 0 }}>💳 Préstamo Activo</div>
              <Link to="/loans" className="btn btn-outline btn-sm">Ver todos <ChevronRight size={14} /></Link>
            </div>
            {activeLoan ? (
              <div>
                <div className="loan-name mb-2">{activeLoan.nombre}</div>
                <div className="loan-amount">${(activeLoan.saldoActual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                <div className="loan-rate">Saldo pendiente • {activeLoan.tasaInteresAnual}% anual</div>
                <div className="progress-bar mb-2">
                  <div className="progress-fill gold" style={{ width: `${activeLoan.porcentajePagado || 0}%` }} />
                </div>
                <div className="flex justify-between text-muted text-small">
                  <span>{activeLoan.porcentajePagado || 0}% pagado</span>
                  <span>Cuota: ${activeLoan.cuotaMensual?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}/mes</span>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎉</div>
                <div className="text-muted">Sin préstamos activos</div>
                <Link to="/loans" className="btn btn-primary btn-sm mt-4">Registrar Préstamo</Link>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <div className="section-title" style={{ margin: 0 }}>⚡ Movimientos Recientes</div>
              <Link to="/transactions" className="btn btn-outline btn-sm">Ver todos <ChevronRight size={14} /></Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.slice(0, 6).map((tx) => (
                <div key={tx._id} className="flex justify-between items-center" style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{tx.descripcion || tx.categoria}</div>
                    <div className="text-muted text-small">{tx.categoria}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: tx.tipo === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                    {tx.tipo === 'ingreso' ? '+' : '-'}${tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center text-muted" style={{ padding: '24px' }}>Sin transacciones recientes</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
