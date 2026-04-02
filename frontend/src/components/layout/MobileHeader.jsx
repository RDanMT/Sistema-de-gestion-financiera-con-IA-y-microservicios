import { Menu, Bot } from 'lucide-react';

export default function MobileHeader({ onOpenSidebar }) {
  return (
    <header className="mobile-header">
      <button className="mobile-menu-toggle" onClick={onOpenSidebar}>
        <Menu size={24} />
      </button>
      <div className="mobile-logo">
        <div className="sidebar-logo-icon" style={{ width: '28px', height: '28px', fontSize: '14px' }}>💰</div>
        <span className="sidebar-logo-text">FinanzasIQ</span>
      </div>
      <div style={{ width: '24px' }}>{/* Spacing to center logo */}</div>
    </header>
  );
}
