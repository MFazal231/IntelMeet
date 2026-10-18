import { Bell, CalendarDays, CheckCircle2, ChevronDown, LayoutGrid, LogOut, MessageSquareText, MoonStar, Plus, Search, Sparkles, Video, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const navItems = [
  { label: 'Overview', icon: LayoutGrid, to: '/dashboard' },
  { label: 'Calendar', icon: CalendarDays, to: '/dashboard' },
  { label: 'Team Chat', icon: MessageSquareText, to: '/dashboard' },
  { label: 'Workspace', icon: Video, to: '/workspace' },
  { label: 'Tasks', icon: CheckCircle2, to: '/tasks' },
  { label: 'AI Meeting Notes', icon: Sparkles, to: '/ai-notes' },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 w-72 border-r border-slate-800 bg-slate-900/90 p-6 backdrop-blur">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-semibold">IntellMeet</p>
            <p className="text-xs text-slate-400">Enterprise meeting OS</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink key={label} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${isActive ? 'bg-violet-500/20 text-violet-100' : 'text-slate-300 hover:bg-slate-800'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Workspace</p>
          <p className="mt-2 font-medium">Northstar Labs</p>
          <p className="mt-1 text-sm text-slate-400">12 teammates · 6 active rooms</p>
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-sm font-semibold">{user?.name?.[0] || 'U'}</div>
            <div>
              <p className="text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400">Operations Lead</p>
            </div>
          </div>
          <button onClick={logout} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800" aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="ml-72 min-h-screen">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-300 md:hidden">
                <X className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Monday, 8:30 AM</p>
                <h1 className="text-2xl font-semibold">Overview</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 md:flex">
                <Search className="h-4 w-4 text-slate-400" />
                <input placeholder="Search meetings, people, notes" className="w-56 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500" />
              </div>
              <button className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white shadow-glow hover:bg-violet-400">
                <Plus className="h-4 w-4" />
                Quick create
              </button>
              <button className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-200">
                <Bell className="h-4 w-4" />
              </button>
              <button className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-200">
                <MoonStar className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-2 py-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-xs font-bold">{user?.name?.[0] || 'U'}</div>
                <span className="text-sm">{user?.name || 'User'}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
