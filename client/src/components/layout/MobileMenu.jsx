import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../app/constants';
import { NavIcon } from './navIcons';
import SidebarBranding from './SidebarBranding';

const linkClass = ({ isActive }) =>
  `flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
    isActive
      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent-primary)]'
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-container)] hover:text-[var(--text-primary)]'
  }`;

const MobileMenu = ({ open, onClose }) => {
  const navItems = NAV_ITEMS;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] lg:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <aside
        className={`absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col bg-[var(--surface-card)] p-4 shadow-[var(--shadow-soft)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 px-2 pt-2">
          <p className="text-lg font-extrabold text-[var(--text-primary)]">Panel de exámenes</p>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {navItems.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={linkClass}
              style={{
                transition: 'opacity 350ms ease, transform 350ms ease',
                transitionDelay: open ? `${120 + i * 45}ms` : '0ms',
                opacity: open ? 1 : 0,
                transform: open ? 'translateX(0)' : 'translateX(-14px)',
              }}
            >
              <NavIcon name={item.icon} size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--divider)] pt-4">
          <SidebarBranding />
        </div>
      </aside>

    </div>,
    document.body
  );
};

export default MobileMenu;
