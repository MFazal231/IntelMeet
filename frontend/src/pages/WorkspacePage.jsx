import { useEffect, useState } from 'react';
import {
  FolderKanban,
  Plus,
  Users,
  Mail,
  Shield,
  FileText,
  ExternalLink,
  X,
  CheckCircle2,
  Building2,
  Trash2
} from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import api from '../services/api.js';

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [isInviting, setIsInviting] = useState(false);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('doc');
  const [resourceLink, setResourceLink] = useState('');
  const [isAddingResource, setIsAddingResource] = useState(false);

  const [toastMessage, setToastMessage] = useState('');

  const loadWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      const items = response.data.workspaces || [];
      setWorkspaces(items);
      setActiveWorkspace(items[0] || null);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail && !inviteName) return;

    setIsInviting(true);
    try {
      const res = await api.post(`/workspaces/${activeWorkspace.id}/members`, {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setActiveWorkspace((prev) => ({
        ...prev,
        members: res.data.members || [...(prev.members || []), res.data.member],
      }));

      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('Member');
      setToastMessage(`Invited ${inviteName || inviteEmail} to the workspace!`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Failed to invite member:', err);
    } finally {
      setIsInviting(false);
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resourceTitle.trim()) return;

    setIsAddingResource(true);
    try {
      const res = await api.post(`/workspaces/${activeWorkspace.id}/resources`, {
        title: resourceTitle.trim(),
        type: resourceType,
        link: resourceLink.trim(),
      });

      setActiveWorkspace((prev) => ({
        ...prev,
        resources: res.data.resources || [res.data.resource, ...(prev.resources || [])],
      }));

      setIsResourceModalOpen(false);
      setResourceTitle('');
      setResourceLink('');
      setToastMessage('Resource added to workspace!');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Failed to add resource:', err);
    } finally {
      setIsAddingResource(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Workspace Hero */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-semibold">
                  Team Workspace
                </p>
                {toastMessage && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {toastMessage}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-3xl font-semibold text-white">
                {loading ? 'Loading workspace…' : activeWorkspace?.name || 'Northstar Labs'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 leading-relaxed">
                {activeWorkspace?.description ||
                  'Shared enterprise collaboration hub for cross-functional sprint planning, live meeting rooms, and synchronized artifacts.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Invite member
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Members & Resources */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Members Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">Team Members</h3>
                <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs text-violet-300 font-medium">
                  {activeWorkspace?.members?.length || 0}
                </span>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            <div className="space-y-3">
              {activeWorkspace?.members?.length > 0 ? (
                activeWorkspace.members.map((member, index) => (
                  <div
                    key={member.id || index}
                    className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-md">
                        {member.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        member.role === 'Owner'
                          ? 'bg-violet-500/20 text-violet-300'
                          : member.role === 'Admin'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {member.role || 'Member'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">No workspace members found.</p>
              )}
            </div>
          </div>

          {/* Shared Resources Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">Shared Resources</h3>
                <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs text-violet-300 font-medium">
                  {activeWorkspace?.resources?.length || 0}
                </span>
              </div>
              <button
                onClick={() => setIsResourceModalOpen(true)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            <div className="space-y-3">
              {activeWorkspace?.resources?.length > 0 ? (
                activeWorkspace.resources.map((res, index) => (
                  <div
                    key={res.id || index}
                    className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-violet-300">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{res.title}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{res.type || 'Document'}</p>
                      </div>
                    </div>
                    {res.link && (
                      <a
                        href={res.link}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-2 text-slate-400 hover:text-violet-300 hover:bg-slate-800 transition"
                        title="Open Resource"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">No shared resources added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* INVITE MEMBER MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
                >
                  <option value="Member">Member (Join meetings, edit notes)</option>
                  <option value="Admin">Admin (Manage members & meetings)</option>
                  <option value="Viewer">Viewer (Read-only access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(!inviteEmail && !inviteName) || isInviting}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 disabled:opacity-40"
                >
                  {isInviting ? 'Sending Invite...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD RESOURCE MODAL */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">Add Workspace Resource</h3>
              </div>
              <button
                onClick={() => setIsResourceModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddResource} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300">Resource Title</label>
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g. Sprint Backlog & Epics"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Resource Type</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-violet-500"
                >
                  <option value="doc">Document / Runbook</option>
                  <option value="kanban">Kanban / Project Board</option>
                  <option value="audio">Audio / Meeting Recording</option>
                  <option value="link">External Link / Tool</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Link URL (Optional)</label>
                <input
                  type="url"
                  value={resourceLink}
                  onChange={(e) => setResourceLink(e.target.value)}
                  placeholder="https://..."
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResourceModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resourceTitle.trim() || isAddingResource}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 disabled:opacity-40"
                >
                  {isAddingResource ? 'Adding...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
