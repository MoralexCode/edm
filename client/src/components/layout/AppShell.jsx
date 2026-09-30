import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import BottomNav from './BottomNav';

const AppShell = () => {
  const isLandingEditor = false;

  return (
    <div
      className={
        isLandingEditor
          ? 'flex h-dvh flex-col overflow-hidden text-[var(--text-primary)]'
          : 'min-h-screen text-[var(--text-primary)]'
      }
    >
      <div className="hidden lg:fixed lg:inset-y-0 lg:block lg:w-72 lg:p-3">
        <div className="h-full overflow-hidden rounded-[var(--radius-lg)]">
          <AppSidebar />
        </div>
      </div>

      <div className={isLandingEditor ? 'flex min-h-0 flex-1 flex-col lg:pl-72' : 'lg:pl-72'}>
        <main
          className={
            isLandingEditor
              ? 'flex min-h-0 flex-1 flex-col px-0 pb-28 lg:pb-0'
              : 'mx-auto w-full max-w-5xl px-4 pb-28 lg:px-8 lg:pb-12'
          }
        >
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default AppShell;
