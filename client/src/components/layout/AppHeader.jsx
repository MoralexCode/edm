import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../app/constants';
import { NavIcon } from './navIcons';
import MobileMenu from './MobileMenu';

const HamburgerButton = ({ open, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-pill)] bg-[var(--surface-card)] text-[var(--text-primary)] transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] lg:hidden"
    aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
    aria-expanded={open}
  >
    <span className="relative block h-4 w-5">
      <span
        className={`absolute left-0 top-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ${
          open ? 'top-1/2 -translate-y-1/2 rotate-45' : ''
        }`}
      />
      <span
        className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full bg-current transition-all duration-300 ${
          open ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <span
        className={`absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ${
          open ? 'bottom-1/2 translate-y-1/2 -rotate-45' : ''
        }`}
      />
    </span>
  </button>
);

const findActiveItem = (pathname) =>
  [...NAV_ITEMS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) =>
      item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
    );

const AppHeader = ({ title }) => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeItem = findActiveItem(pathname);

  return (
    <header className="sticky top-0 z-20 px-4 pb-2 pt-4 backdrop-blur lg:px-8 lg:pt-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <HamburgerButton open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />

        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Móvil: icono de la sección (indicador de ubicación, no interactivo) */}
          <span
            className="flex shrink-0 items-center text-[var(--text-secondary)] lg:hidden"
            aria-label={activeItem?.label || title}
          >
            <NavIcon name={activeItem?.icon || 'dashboard'} size={20} strokeWidth={2} />
          </span>

          {/* Escritorio: título de la sección */}
          {title && (
            <h1 className="hidden truncate text-2xl font-extrabold text-[var(--text-primary)] lg:block lg:text-3xl">
              {title}
            </h1>
          )}
        </div>

      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
};

export default AppHeader;
