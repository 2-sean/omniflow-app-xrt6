import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Bell, Home, Settings, User, Zap } from 'lucide-react';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const TABS = [
  { path: '/', label: '首页', icon: Home },
  { path: '/stats', label: '统计', icon: BarChart3 },
  { path: '/alerts', label: '提醒', icon: Bell },
  { path: '/me', label: '我的', icon: User },
] as const;

const AppLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Zap className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight">宿舍电费管家</span>
          </div>
          <button
            type="button"
            aria-label="预警设置"
            onClick={() => navigate('/alerts')}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
          >
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl items-center justify-around">
          {TABS.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <button
                key={path}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => navigate(path)}
                className={cn(
                  'flex min-h-[56px] min-w-[64px] cursor-pointer flex-col items-center justify-center gap-1 px-3',
                  active ? 'text-blue-500' : 'text-slate-500'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <OmniflowBadge />
      <Toaster position="top-center" />
    </div>
  );
};

export default AppLayout;
