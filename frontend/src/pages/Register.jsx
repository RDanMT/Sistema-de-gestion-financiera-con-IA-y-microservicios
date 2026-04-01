import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    const result = await register(form.nombre, form.email, form.password);
    if (result.success) {
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <div>
            <div className="auth-logo-text">FinanzasIQ</div>
            <div className="auth-logo-sub">Sistema de Gestión Financiera</div>
          </div>
        </div>

        <h1 className="auth-title">Crear Cuenta</h1>
        <p className="auth-subtitle">Toma el control de tus finanzas hoy</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input type="text" className="form-input" placeholder="María García" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="tu@email.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-input" placeholder="Min. 8 caracteres" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar</label>
              <input type="password" className="form-input" placeholder="Repetir contraseña" value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
          </div>

          <p className="text-muted text-small mb-4" style={{ marginTop: '-8px' }}>
            🔒 La contraseña debe tener mayúscula, minúscula y número
          </p>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={isLoading}>
            {isLoading ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Creando cuenta...</> : 'Crear Cuenta Gratis'}
          </button>
        </form>

        <div className="auth-divider mt-4 mb-4">o</div>
        <p className="text-center text-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
