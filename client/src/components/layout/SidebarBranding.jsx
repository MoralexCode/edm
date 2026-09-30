import { Moon, Sun } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '../../app/constants';
import { useTheme } from '../../app/theme/ThemeProvider';

const SidebarBranding = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="mb-3 flex items-center gap-3 px-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{APP_NAME}</p>
        <p className="truncate text-xs text-[var(--text-secondary)]">{APP_TAGLINE}</p>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="c-btn-circle h-9 w-9 shrink-0"
        aria-label="Cambiar tema"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
};

export default SidebarBranding;
