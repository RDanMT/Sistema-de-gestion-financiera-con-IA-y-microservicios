import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { Plus, X, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['alimentacion','transporte','vivienda','salud','educacion','entretenimiento','ropa','servicios','inversiones','salario','freelance','prestamo','ahorro','otro'];
const CATEGORY_EMOJI = { alimentacion:'🍔', transporte:'🚗', vivienda:'🏠', salud:'💊', educacion:'📚', entretenimiento:'🎬', ropa:'👕', servicios:'💡', inversiones:'📈', salario:'💼', freelance:'💻', prestamo:'🏦', ahorro:'🏦', otro:'📝' };

export default function Transactions() {
  const { transactions, fetchTransactions, createTransaction, deleteTransaction, isLoading } = useFinanceStore();
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ tipo: '', categoria: '', page: 1 });
  const [form, setForm] = useState({ tipo: 'gasto', monto: '', categoria: 'alimentacion', descripcion: '', fecha: new Date().toISOString().split('T')[0] });

  const loadData = () => {
    const params = { page: filters.page, limit: 20 };
    if (filters.tipo) params.tipo = filters.tipo;
    if (filters.categoria) params.categoria = filters.categoria;
    fetchTransactions(params);
  };

  useEffect(() => { loadData(); }, [filters.tipo, filters.categoria, filters.page]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await createTransaction({ ...form, monto: parseFloat(form.monto) });
    if (result.success) {
      toast.success('✅ Transacción registrada');
      setShowModal(false);
      setForm({ tipo: 'gasto', monto: '', categoria: 'alimentacion', descripcion: '', fecha: new Date().toISOString().split('T')[0] });
      loadData();
    } else {
      toast.error(result.error || 'Error al registrar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta transacción?')) return;
    const result = await deleteTransaction(id);
    if (result.success) toast.success('Transacción eliminada');
  };

  const totalIngresos = transactions.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const totalGastos = transactions.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transacciones</h1>
          <p className="page-subtitle">Historial completo de movimientos financieros</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nueva Transacción
        </button>
      </div>

      <div className="page-container">
        <div className="metric-grid mb-6">
          <div className="metric-card">
            <div className="metric-label">Total Ingresos (filtro)</div>
            <div className="metric-value green">${totalIngresos.toLocaleString('es-MX', {minimumFractionDigits:2})}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Gastos (filtro)</div>
            <div className="metric-value red">${totalGastos.toLocaleString('es-MX', {minimumFractionDigits:2})}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Transacciones</div>
            <div className="metric-value">{transactions.length}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card mb-4">
          <div className="flex gap-3 items-center">
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select className="form-select" style={{ width: 'auto' }} value={filters.tipo}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value, page: 1 })}>
              <option value="">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
              <option value="transferencia">Transferencias</option>
            </select>
            <select className="form-select" style={{ width: 'auto' }} value={filters.categoria}
              onChange={(e) => setFilters({ ...filters, categoria: e.target.value, page: 1 })}>
              <option value="">Todas las categorías</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
            </select>
            {(filters.tipo || filters.categoria) && (
              <button className="btn btn-outline btn-sm" onClick={() => setFilters({ tipo: '', categoria: '', page: 1 })}>
                <X size={12} /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla de transacciones */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando...</td></tr>
              )}
              {!isLoading && transactions.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Sin transacciones</td></tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td className="text-mono" style={{ fontSize: '12px' }}>{new Date(tx.fecha).toLocaleDateString('es-MX')}</td>
                  <td style={{ fontWeight: 500 }}>{tx.descripcion || '—'}</td>
                  <td><span className="badge badge-blue">{CATEGORY_EMOJI[tx.categoria]} {tx.categoria}</span></td>
                  <td>
                    <span className={`badge ${tx.tipo === 'ingreso' ? 'badge-success' : tx.tipo === 'gasto' ? 'badge-danger' : 'badge-warning'}`}>
                      {tx.tipo}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: tx.tipo === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                    {tx.tipo === 'ingreso' ? '+' : '-'}${tx.monto.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tx._id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nueva transacción */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">➕ Nueva Transacción</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                      <option value="gasto">Gasto</option>
                      <option value="ingreso">Ingreso</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto ($)</label>
                    <input type="number" className="form-input" placeholder="0.00" step="0.01" value={form.monto}
                      onChange={(e) => setForm({ ...form, monto: e.target.value })} required min={0.01} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select className="form-select" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input type="date" className="form-input" value={form.fecha}
                      onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input className="form-input" placeholder="Supermercado, gasolina..." value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary"><Plus size={14} /> Registrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
