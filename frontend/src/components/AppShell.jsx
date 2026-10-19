import { useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  MoonStar,
  Plus,
  Search,
  Sparkles,
  Video,
  X,
  Clock,
  Users
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

const navItems = [
  { label: 'Overview', icon: LayoutGrid, to: '/dashboard' },
  { label: 'Tasks', icon: CheckCircle2, to: '/tasks' },
  { label: 'AI Meeting Notes', icon: Sparkles, to: '/ai-notes' },
  { label: 'Workspace', icon: Video, to: '/workspace' },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Quick Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('45');
  const [participantsInput, setParticipantsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateMeeting = async (joinImmediately = false) => {
    if (!meetingTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const participants = participantsInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await api.post('/meetings', {
        title: meetingTitle.trim(),
        duration: Number(meetingDuration),
        startAt: meetingDate ? new Date(meetingDate).toISOString() : new Date().toISOString(),
        participants: participants.length ? participants : [user?.name || 'Alicia Park'],
      });

      const newMeeting = res.data.meeting;
      setIsModalOpen(false);
      setMeetingTitle('');
      setMeetingDate('');
      setParticipantsInput('');

      if (joinImmediately && newMeeting) {
        navigate(`/room/${encodeURIComponent(newMeeting.meetingCode || newMeeting.id)}`);
      } else {
        navigate('/dashboard');
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to create meeting:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 w-72 border-r border-slate-800 bg-slate-900/90 p-6 backdrop-blur z-20">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300">
            <Video className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight">IntellMeet</p>
            <p className="text-xs text-slate-400">Enterprise meeting OS</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-200 border border-violet-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Workspace</p>
          <p className="mt-2 font-medium text-slate-200">Northstar Labs</p>
          <p className="mt-1 text-xs text-slate-400">12 teammates · Active room mesh</p>
        </div>

        {/* User Card at bottom */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white shadow-md">
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400">{user?.role || 'Lead'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
            aria-label="Logout"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="ml-72 min-h-screen">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">Enterprise Collaboration Platform</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white">IntellMeet OS</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 md:flex">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  placeholder="Search meetings, notes, tasks..."
                  className="w-56 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                />
              </div>

              {/* Quick Create Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Quick create
              </button>

              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  {user?.name?.[0] || 'U'}
                </div>
                <span className="text-xs font-medium text-slate-200">{user?.name || 'User'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {/* QUICK CREATE MEETING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">Schedule New Meeting</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300">Meeting Title</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Q4 Strategy Review"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Duration (Minutes)</label>
                  <select
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:border-violet-500"
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">
                  Invite Participants (comma separated)
                </label>
                <input
                  type="text"
                  value={participantsInput}
                  onChange={(e) => setParticipantsInput(e.target.value)}
                  placeholder="e.g. Marcus Chen, Ava Wong, David Lee"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!meetingTitle.trim() || isSubmitting}
                onClick={() => handleCreateMeeting(false)}
                className="rounded-xl border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-600/30 disabled:opacity-40"
              >
                Schedule
              </button>
              <button
                type="button"
                disabled={!meetingTitle.trim() || isSubmitting}
                onClick={() => handleCreateMeeting(true)}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 disabled:opacity-40"
              >
                {isSubmitting ? 'Creating...' : 'Create & Join Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
