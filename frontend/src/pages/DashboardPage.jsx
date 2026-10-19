import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, CircleDashed, Clock3, Sparkles, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [meetingsRes, tasksRes, workspacesRes] = await Promise.all([
          api.get('/meetings'),
          api.get('/tasks'),
          api.get('/workspaces'),
        ]);

        if (!active) return;

        setUpcoming((meetingsRes.data.meetings || []).slice(0, 3));
        setTasks(tasksRes.data.tasks || []);
        setWorkspaceCount((workspacesRes.data.workspaces || []).length);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const metrics = [
    { label: 'Upcoming meetings', value: upcoming.length },
    { label: 'Completed', value: 12 },
    { label: 'Pending actions', value: tasks.filter((item) => item.status !== 'Completed').length },
    { label: 'Workspaces', value: workspaceCount },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Good morning</p>
              <h2 className="mt-2 text-3xl font-semibold">{user?.name || 'Alicia'}, here’s your day.</h2>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Today</p>
              <p className="mt-1 text-xl font-medium">Monday, Oct 18</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold">{loading ? '…' : item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Upcoming meetings</h3>
              <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">{upcoming.length} scheduled</span>
            </div>
            <div className="space-y-4">
              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-400">No meetings scheduled yet.</p>
              ) : (
                upcoming.map((meeting) => (
                  <div key={meeting.id || meeting.title} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{new Date(meeting.startAt).toLocaleString()}</p>
                      <p className="mt-1 text-xs text-slate-500">{(meeting.participants || []).join(', ') || 'Invite-only room'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300 font-medium">{meeting.status || 'Scheduled'}</span>
                      <button
                        onClick={() => navigate(`/room/${encodeURIComponent(meeting.meetingCode || meeting.id || 'general')}`)}
                        className="rounded-xl bg-violet-600 hover:bg-violet-500 transition px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-violet-600/20"
                      >
                        Join Room
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Cancel meeting "${meeting.title}"?`)) {
                            try {
                              await api.delete(`/meetings/${meeting.id}`);
                              setUpcoming((prev) => prev.filter((m) => m.id !== meeting.id));
                            } catch (e) {
                              console.error(e);
                            }
                          }
                        }}
                        className="rounded-xl border border-slate-800 p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                        title="Cancel meeting"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="mb-4 text-xl font-semibold">Quick actions</h3>
              <div className="space-y-3 text-sm">
                <button
                  onClick={() => {
                    const quickCode = `INT-${Math.floor(1000 + Math.random() * 9000)}`;
                    navigate(`/room/${quickCode}`);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-violet-500/40 bg-violet-600/20 px-4 py-3 text-left text-violet-200 hover:bg-violet-600/30 transition"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <CalendarDays className="h-4 w-4 text-violet-400" /> Start instant meeting
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => navigate('/workspace')} className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-left text-slate-200 hover:bg-slate-800 transition">
                  <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Create workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => navigate('/ai-notes')} className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-left text-slate-200 hover:bg-slate-800 transition">
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Generate AI notes</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="mb-4 text-xl font-semibold">Recent activity</h3>
              <div className="space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <div>
                    <p>AI summary was generated for the launch sync.</p>
                    <p className="mt-1 text-xs text-slate-500">12 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-violet-300" />
                  <div>
                    <p>Meeting note was assigned to product design.</p>
                    <p className="mt-1 text-xs text-slate-500">Today · 8:00 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CircleDashed className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p>New workspace invite accepted by two teammates.</p>
                    <p className="mt-1 text-xs text-slate-500">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
