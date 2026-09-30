import { NavLink } from 'react-router-dom';
import { BOTTOM_NAV_ITEMS } from '../../app/constants';
import { NavIcon } from './navIcons';

const itemClass = ({ isActive }) =>
  `flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-pill)] py-2 text-[0.65rem] font-semibold transition-colors duration-200 ${
    isActive
      ? 'text-[var(--text-on-accent-primary)]'
      : 'text-[var(--text-secondary)]'
  }`;

const BottomNav = () => {
  const bottomNavItems = BOTTOM_NAV_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--surface-card)] p-2 shadow-[var(--shadow-soft)]">
        {bottomNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={itemClass}>
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] transition-colors duration-200 ${
                    isActive ? 'bg-[var(--accent-primary)]' : ''
                  }`}
                >
                  <NavIcon name={item.icon} size={19} strokeWidth={isActive ? 2.4 : 1.8} />
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
