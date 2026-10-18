import { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Search, SlidersHorizontal } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import api from '../services/api.js';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;

    const response = await api.post('/tasks', { title: title.trim(), priority });
    setTasks((current) => [response.data.task, ...current]);
    setTitle('');
    setPriority('Medium');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Tasks</p>
              <h2 className="mt-2 text-3xl font-semibold">Action items</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                <Search className="h-4 w-4" />
                Search tasks
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <form onSubmit={handleSubmit} className="mb-6 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="New action item" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500" />
            <select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm text-white"><Plus className="h-4 w-4" /> New task</button>
          </form>

          <div className="mb-4 flex items-center gap-2 text-sm text-slate-300"><SlidersHorizontal className="h-4 w-4" /> Filters and sort</div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-400">Loading tasks…</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-slate-400">No tasks yet. Add one above.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id || task.title} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:flex-row md:items-center">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span>{task.owner || 'Unassigned'}</span>
                      <span>•</span>
                      <span>{task.priority || 'Medium'} priority</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">{task.status || 'To Do'}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
