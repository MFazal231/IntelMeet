import { useEffect, useState } from 'react';
import { FolderKanban, Plus, Users } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import api from '../services/api.js';

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await api.get('/workspaces');
        if (!active) return;
        const items = response.data.workspaces || [];
        setWorkspace(items[0] || null);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Workspace</p>
              <h2 className="mt-2 text-3xl font-semibold">{loading ? 'Loading workspace…' : (workspace?.name || 'No workspace')}</h2>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm text-white"><Plus className="h-4 w-4" /> Invite member</button>
          </div>
          <p className="mt-4 max-w-2xl text-slate-300">{workspace?.description || 'Create or join a workspace to coordinate your team and artifacts.'}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-violet-300" /> <h3 className="text-xl font-semibold">Members</h3></div>
            <div className="space-y-3">
              {workspace ? (
                Array.from({ length: workspace.members || 3 }).map((_, index) => (
                  <div key={`${workspace.id}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                    <span>Team member {index + 1}</span>
                    <span className="text-xs text-slate-400">{index === 0 ? 'Owner' : 'Member'}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No workspace members found.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-3 flex items-center gap-2"><FolderKanban className="h-4 w-4 text-violet-300" /> <h3 className="text-xl font-semibold">Shared resources</h3></div>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">Product launch notes</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">Customer interview transcript</div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">Meeting checklist</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
