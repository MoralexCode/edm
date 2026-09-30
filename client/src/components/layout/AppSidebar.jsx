import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../app/constants';
import { NavIcon } from './navIcons';
import SidebarBranding from './SidebarBranding';

const navLinkClass = ({ isActive }) =>
  `flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
    isActive
      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent-primary)]'
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-container)] hover:text-[var(--text-primary)]'
  }`;

const AppSidebar = ({ onNavigate }) => {
  const navItems = NAV_ITEMS;

  return (
    <>
      <aside className="flex h-full w-full flex-col bg-[var(--surface-card)] p-4">
        <div className="mb-8 px-2 pt-2">
          <p className="text-lg font-extrabold text-[var(--text-primary)]">Panel de exámenes</p>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={navLinkClass}
              onClick={onNavigate}
            >
              <NavIcon name={item.icon} size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 shrink-0 border-t border-[var(--divider)] pt-4">
          <SidebarBranding />
        </div>
      </aside>

    </>
  );
};

export default AppSidebar;
