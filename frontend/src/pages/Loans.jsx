import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Plus, X, TrendingDown, Calculator, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPES = ['personal', 'hipotecario', 'automotriz', 'educativo', 'empresarial', 'otro'];

export default function Loans() {
  const { loans, fetchLoans, createLoan, fetchAmortization, simulateExtraPayment, isLoading } = useFinanceStore();
  const [showModal, setShowModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(null);
  const [showAmortization, setShowAmortization] = useState(null);
  const [amortData, setAmortData] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [simPct, setSimPct] = useState(15);
  const [form, setForm] = useState({ nombre: '', tipoPrestamo: 'personal', capitalInicial: '', tasaInteresAnual: '', plazoMeses: '', entidadFinanciera: '', notas: '' });

  useEffect(() => { fetchLoans(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await createLoan({
      ...form,
      capitalInicial: parseFloat(form.capitalInicial),
      tasaInteresAnual: parseFloat(form.tasaInteresAnual),
      plazoMeses: parseInt(form.plazoMeses),
    });
    if (result.success) {
      toast.success('✅ Préstamo creado exitosamente');
      setShowModal(false);
      setForm({ nombre: '', tipoPrestamo: 'personal', capitalInicial: '', tasaInteresAnual: '', plazoMeses: '', entidadFinanciera: '', notas: '' });
    } else {
      toast.error(result.error || 'Error al crear préstamo');
    }
  };

  const handleSimulate = async (loanId) => {
    const result = await simulateExtraPayment(loanId, simPct);
    if (result.success) setSimResult(result.data);
    else toast.error(result.error);
  };

  const handleAmortization = async (loanId) => {
    if (showAmortization === loanId) { setShowAmortization(null); return; }
    const data = await fetchAmortization(loanId);
    setAmortData(data);
    setShowAmortization(loanId);
  };

  const activeLoans = loans.filter((l) => l.estado === 'activo');
  const paidLoans = loans.filter((l) => l.estado === 'pagado');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Préstamos</h1>
          <p className="page-subtitle">Gestiona y proyecta tus créditos financieros</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nuevo Préstamo
        </button>
      </div>

      <div className="page-container">
        {/* Métricas rápidas */}
        <div className="metric-grid mb-6">
          <div className="metric-card gold">
            <div className="metric-label">Préstamos Activos</div>
            <div className="metric-value">{activeLoans.length}</div>
          </div>
          <div className="metric-card danger">
            <div className="metric-label">Deuda Total</div>
            <div className="metric-value red">${activeLoans.reduce((s, l) => s + (l.saldoActual || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Cuota Mensual Total</div>
            <div className="metric-value">${activeLoans.reduce((s, l) => s + (l.cuotaMensual || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Préstamos Pagados</div>
            <div className="metric-value green">{paidLoans.length}</div>
          </div>
        </div>

        {/* Lista de préstamos */}
        {loans.length === 0 && !isLoading && (
          <div className="card text-center" style={{ padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
            <div className="section-title" style={{ justifyContent: 'center' }}>Sin préstamos registrados</div>
            <p className="text-muted mb-4">Registra tu primer préstamo para comenzar a proyectar</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Agregar Préstamo</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loans.map((loan) => (
            <div key={loan._id} className="loan-card">
              <div className="loan-header">
                <div>
                  <div className="loan-name">{loan.nombre}</div>
                  <div className="loan-type">{loan.tipoPrestamo} {loan.entidadFinanciera ? `• ${loan.entidadFinanciera}` : ''}</div>
                </div>
                <span className={`badge ${loan.estado === 'activo' ? 'badge-blue' : loan.estado === 'pagado' ? 'badge-success' : 'badge-warning'}`}>
                  {loan.estado}
                </span>
              </div>

              <div className="grid-3 mb-4">
                <div>
                  <div className="text-muted text-small">Saldo Pendiente</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                    ${(loan.saldoActual || loan.capitalInicial).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-muted text-small">Capital Inicial</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ${loan.capitalInicial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="text-muted text-small">Cuota Mensual</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--gold)' }}>
                    ${loan.cuotaMensual?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 items-center mb-3">
                <span className="badge badge-blue">{loan.tasaInteresAnual}% anual</span>
                <span className="badge badge-warning">{loan.plazoMeses} meses</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{loan.pagos?.length || 0} pagos realizados</span>
              </div>

              {loan.estado === 'activo' && (
                <>
                  <div className="progress-bar mb-2">
                    <div className="progress-fill gold" style={{ width: `${loan.porcentajePagado || 0}%` }} />
                  </div>
                  <div className="flex justify-between text-muted text-small mb-4">
                    <span>{loan.porcentajePagado || 0}% completado</span>
                    <span>{loan.plazoMeses - (loan.pagos?.length || 0)} meses restantes</span>
                  </div>

                  <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm" onClick={() => handleAmortization(loan._id)}>
                      <Calculator size={14} /> Tabla {showAmortization === loan._id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                    <button className="btn btn-gold btn-sm" onClick={() => { setShowSimulator(loan._id); setSimResult(null); }}>
                      <TrendingDown size={14} /> Simular Pago Extra
                    </button>
                  </div>
                </>
              )}

              {/* Tabla de amortización */}
              {showAmortization === loan._id && amortData && (
                <div className="mt-4">
                  <div className="section-title">📋 Tabla de Amortización</div>
                  <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Mes</th><th>Cuota</th><th>Capital</th><th>Interés</th><th>Saldo</th><th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {amortData.tabla?.slice(0, 60).map((row) => (
                          <tr key={row.mes} style={{ opacity: row.completado ? 0.5 : 1 }}>
                            <td className="table-mono">{row.mes}</td>
                            <td className="table-mono">${row.cuota?.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                            <td className="table-mono text-success">${row.capital?.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                            <td className="table-mono text-danger">${row.interes?.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                            <td className="table-mono">${row.saldo_pendiente?.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                            <td><div className="progress-bar" style={{width: '60px'}}><div className="progress-fill" style={{width: `${row.porcentaje_completado}%`}}/></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Simulador de pago extra */}
              {showSimulator === loan._id && (
                <div className="mt-4 card" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="section-title" style={{ margin: 0 }}>⚡ Simulador de Pago Extra</div>
                    <button className="modal-close" onClick={() => { setShowSimulator(null); setSimResult(null); }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-3 items-center mb-4">
                    <div style={{ flex: 1 }}>
                      <label className="form-label">% Extra sobre cuota mensual</label>
                      <input type="number" className="form-input" value={simPct} min={1} max={100}
                        onChange={(e) => setSimPct(e.target.value)} />
                    </div>
                    <button className="btn btn-gold" style={{ marginTop: '22px' }} onClick={() => handleSimulate(loan._id)}>
                      Calcular
                    </button>
                  </div>

                  {simResult && (
                    <div className="grid-2">
                      <div style={{ padding: '16px', background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div className="text-muted text-small">💰 Ahorro en Intereses</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                          ${simResult.ahorro_total_intereses?.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                        </div>
                        <div className="text-small text-muted">{simResult.desglose_por_mes?.ahorro_porcentual}% menos intereses</div>
                      </div>
                      <div style={{ padding: '16px', background: 'var(--primary-glow)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <div className="text-muted text-small">📅 Meses Menos</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                          {simResult.meses_menos} meses
                        </div>
                        <div className="text-small text-muted">Nueva liquidación: {simResult.nueva_fecha_liquidacion}</div>
                      </div>
                      <div>
                        <div className="text-muted text-small">Pago mensual con extra</div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${simResult.pago_mensual_con_extra?.toLocaleString('es-MX', {minimumFractionDigits: 2})}</div>
                      </div>
                      <div>
                        <div className="text-muted text-small">Liquidación original</div>
                        <div style={{ fontWeight: 700 }}>{simResult.fecha_liquidacion_original}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal crear préstamo */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💳 Nuevo Préstamo</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Nombre del Préstamo</label>
                  <input className="form-input" placeholder="Ej. Préstamo Auto 2024" value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-select" value={form.tipoPrestamo} onChange={(e) => setForm({ ...form, tipoPrestamo: e.target.value })}>
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Entidad Financiera</label>
                    <input className="form-input" placeholder="BBVA, Banamex..." value={form.entidadFinanciera}
                      onChange={(e) => setForm({ ...form, entidadFinanciera: e.target.value })} />
                  </div>
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Capital ($)</label>
                    <input type="number" className="form-input" placeholder="100000" value={form.capitalInicial}
                      onChange={(e) => setForm({ ...form, capitalInicial: e.target.value })} required min={1} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tasa Anual (%)</label>
                    <input type="number" className="form-input" placeholder="12.5" step="0.01" value={form.tasaInteresAnual}
                      onChange={(e) => setForm({ ...form, tasaInteresAnual: e.target.value })} required min={0} max={100} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plazo (meses)</label>
                    <input type="number" className="form-input" placeholder="36" value={form.plazoMeses}
                      onChange={(e) => setForm({ ...form, plazoMeses: e.target.value })} required min={1} />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary"><Plus size={14} /> Registrar Préstamo</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
