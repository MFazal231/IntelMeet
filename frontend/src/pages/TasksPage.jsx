import { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Clock,
  AlertCircle,
  Tag,
  Circle,
  CheckCircle,
  X
} from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import api from '../services/api.js';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [owner, setOwner] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'To Do' | 'In Progress' | 'Completed'
  const [priorityFilter, setPriorityFilter] = useState('All'); // 'All' | 'High' | 'Medium' | 'Low'
  const [toastMessage, setToastMessage] = useState('');

  const loadTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
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

    try {
      const response = await api.post('/tasks', {
        title: title.trim(),
        priority,
        owner: owner.trim() || undefined,
      });
      setTasks((current) => [response.data.task, ...current]);
      setTitle('');
      setOwner('');
      setPriority('Medium');
      setToastMessage('Task added!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Toggle completion
  const handleToggleComplete = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    try {
      const response = await api.patch(`/tasks/${task.id}`, { status: nextStatus });
      setTasks((current) =>
        current.map((t) => (t.id === task.id ? response.data.task : t))
      );
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Cycle status
  const handleCycleStatus = async (task) => {
    const sequence = ['To Do', 'In Progress', 'Completed'];
    const nextIdx = (sequence.indexOf(task.status) + 1) % sequence.length;
    const nextStatus = sequence[nextIdx];

    try {
      const response = await api.patch(`/tasks/${task.id}`, { status: nextStatus });
      setTasks((current) =>
        current.map((t) => (t.id === task.id ? response.data.task : t))
      );
    } catch (err) {
      console.error('Failed to cycle task status:', err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((current) => current.filter((t) => t.id !== taskId));
      setToastMessage('Task deleted.');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.owner?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' ? true : t.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'All' ? true : t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Counts
  const counts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const high = tasks.filter((t) => t.priority === 'High' && t.status !== 'Completed').length;
    return { total, completed, inProgress, high };
  }, [tasks]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Hero */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-semibold">
                  Action Item Board
                </p>
                {toastMessage && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {toastMessage}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-3xl font-semibold text-white">Tasks & Deliverables</h2>
              <p className="mt-1 text-sm text-slate-400">
                Track decisions and follow-ups extracted from meetings into completed actions.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p>
                <p className="text-lg font-bold text-slate-100">{counts.total}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400">Done</p>
                <p className="text-lg font-bold text-emerald-300">{counts.completed}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-rose-400">Urgent</p>
                <p className="text-lg font-bold text-rose-300">{counts.high}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Creation & Filters */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
          {/* New Task Form */}
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 md:grid-cols-[1.5fr_160px_140px_auto] items-center pb-6 border-b border-slate-800"
          >
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to be done? (e.g. Schedule SOC2 audit call)"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-500"
            />
            <input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="Assignee (e.g. Alicia)"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-500"
            />
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-violet-500"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
            <button
              type="submit"
              disabled={!title.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 transition disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          </form>

          {/* Filter & Search Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {['All', 'To Do', 'In Progress', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === status
                      ? 'bg-violet-600/20 text-violet-200 border border-violet-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Priority Selector & Search */}
            <div className="flex items-center gap-3">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tasks..."
                  className="bg-transparent outline-none text-xs text-slate-200 w-32 placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-300">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-8">Loading tasks…</p>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
                <CheckCircle2 className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <p>No action items match the selected filter.</p>
                <p className="text-xs text-slate-500 mt-1">Add a task above or sync items from meeting notes.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isCompleted = task.status === 'Completed';

                return (
                  <div
                    key={task.id}
                    className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 transition md:flex-row md:items-center ${
                      isCompleted
                        ? 'border-slate-800/60 bg-slate-950/40 opacity-70'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className={`mt-0.5 rounded-lg p-0.5 transition ${
                          isCompleted
                            ? 'text-emerald-400 hover:text-slate-400'
                            : 'text-slate-500 hover:text-emerald-400'
                        }`}
                        title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>

                      <div>
                        <p
                          className={`font-medium text-sm text-slate-100 ${
                            isCompleted ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2.5 text-xs text-slate-400">
                          <span className="text-slate-300">{task.owner || 'Unassigned'}</span>
                          <span>•</span>
                          <span
                            className={`font-semibold ${
                              task.priority === 'High'
                                ? 'text-rose-400'
                                : task.priority === 'Medium'
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {task.priority || 'Medium'} priority
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      {/* Clickable Status Badge that cycles */}
                      <button
                        onClick={() => handleCycleStatus(task)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer transition ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : task.status === 'In Progress'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-violet-500/15 text-violet-200 border border-violet-500/30'
                        }`}
                        title="Click to cycle status (To Do -> In Progress -> Completed)"
                      >
                        {task.status || 'To Do'}
                      </button>

                      {/* Delete Task */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
