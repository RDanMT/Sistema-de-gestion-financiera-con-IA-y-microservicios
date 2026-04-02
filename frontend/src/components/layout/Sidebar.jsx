import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, CreditCard, ArrowLeftRight,
  Bot, LogOut, TrendingUp,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/loans', icon: CreditCard, label: 'Préstamos' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transacciones' },
  { to: '/ai-chat', icon: Bot, label: 'Asistente IA' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const initial = user?.nombre?.[0]?.toUpperCase() || 'U';

  return (
    <>
      {/* Overlay para móviles */}
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💰</div>
          <div>
            <div className="sidebar-logo-text">FinanzasIQ</div>
            <div className="sidebar-logo-sub">Gestión Inteligente</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Principal</div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => { if (onClose) onClose(); }}
            >
              <Icon className="nav-icon" size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card mb-2">
            <div className="user-avatar">{initial}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.nombre}
              </div>
              <div className="user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button className="btn btn-outline w-full btn-sm" onClick={handleLogout}>
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
