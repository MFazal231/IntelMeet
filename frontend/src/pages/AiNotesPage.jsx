import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  RefreshCw,
  Sparkles,
  Plus,
  ListTodo,
  Check,
  Send,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import api from '../services/api.js';

const SAMPLE_TRANSCRIPTS = {
  launch: `Quarterly planning recap. We aligned on onboarding improvements, product launch sequencing, and customer-facing demo readiness. The team agreed to finalize the release checklist before Friday and keep security validation as a gating item. Marcus will prepare demo script by Wednesday, and Alicia will review the customer feedback backlog.`,
  sprint: `Sprint 42 kickoff. We decided to prioritize the WebRTC video conference room and real-time audio captions. Ava needs to test audio latency on Friday. David will refactor the database connection pool. Any blocking issues must be escalated immediately before Wednesday standup.`,
  sales: `Enterprise customer discovery with Northstar Labs. The client requested SOC2 compliance documentation and SSO integration. We agreed to provide a custom security packet by next Tuesday. Next follow-up call is scheduled for Thursday 2 PM.`,
};

function normalizeSummaryData(data = {}) {
  const keyPoints = Array.isArray(data.keyPoints) ? data.keyPoints : [];
  const decisions = Array.isArray(data.decisions) ? data.decisions : [];
  const actionItems = Array.isArray(data.actionItems) ? data.actionItems : [];

  return {
    status: data.status || 'ready',
    title: data.title || 'Launch readiness recap',
    summary: data.summary || 'AI summary generated.',
    keyPoints,
    decisions,
    actionItems,
  };
}

export default function AiNotesPage() {
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPTS.launch);
  const [meetingTitle, setMeetingTitle] = useState('Launch readiness recap');
  const [summary, setSummary] = useState({
    status: 'loading',
    title: 'Launch readiness recap',
    summary: '',
    keyPoints: [],
    decisions: [],
    actionItems: [],
  });

  const [toastMessage, setToastMessage] = useState('');
  const [syncedMap, setSyncedMap] = useState({});
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const statusLabel = useMemo(() => {
    if (summary.status === 'loading') return 'Generating';
    if (summary.status === 'error') return 'Error';
    return 'Ready';
  }, [summary.status]);

  const markdownContent = useMemo(() => {
    const lines = [
      `# ${summary.title || 'Meeting Notes'}`,
      '',
      '## Executive Summary',
      summary.summary || 'No summary available yet.',
      '',
      '## Key Points',
      ...(summary.keyPoints.length
        ? summary.keyPoints.map((item) => `- ${item}`)
        : ['- No key points captured yet.']),
      '',
      '## Decisions',
      ...(summary.decisions.length
        ? summary.decisions.map((item) => `- ${typeof item === 'string' ? item : item.title || item}`)
        : ['- No decisions captured yet.']),
      '',
      '## Action Items',
      ...(summary.actionItems.length
        ? summary.actionItems.map((item) => {
            const title = typeof item === 'string' ? item : item.title;
            const meta = item.priority ? ` [Priority: ${item.priority}, Owner: ${item.owner || 'Unassigned'}]` : '';
            return `- [ ] ${title}${meta}`;
          })
        : ['- No action items captured yet.']),
      '',
    ];

    return lines.join('\n');
  }, [summary]);

  const downloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(summary.title || 'meeting-notes').toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const loadSummary = async () => {
    setSummary((current) => ({ ...current, status: 'loading' }));
    try {
      const response = await api.post('/ai/summarize', {
        title: meetingTitle,
        transcript: transcript,
      });
      const normalized = normalizeSummaryData(response.data);
      setSummary({ ...normalized, status: normalized.status || 'ready' });
      setSyncedMap({});
    } catch (error) {
      setSummary({
        status: 'error',
        title: meetingTitle,
        summary: 'AI summary is unavailable right now. Please verify API configuration.',
        keyPoints: [],
        decisions: [],
        actionItems: [],
      });
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // Sync All Action Items to Task Board
  const syncAllActionItems = async () => {
    if (!summary.actionItems?.length) return;

    setIsSyncingAll(true);
    try {
      const tasksToSync = summary.actionItems.map((item) => ({
        title: typeof item === 'string' ? item : item.title,
        priority: item.priority || 'Medium',
        owner: item.owner || 'Unassigned',
        status: 'To Do',
      }));

      await api.post('/tasks/bulk', { tasks: tasksToSync });

      const newMap = {};
      summary.actionItems.forEach((_, idx) => {
        newMap[idx] = true;
      });
      setSyncedMap(newMap);

      setToastMessage(`Synced ${tasksToSync.length} tasks to your Workspace Tasks board!`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Failed to sync tasks:', err);
      setToastMessage('Failed to sync tasks.');
      setTimeout(() => setToastMessage(''), 4000);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Sync a single action item
  const syncSingleActionItem = async (item, index) => {
    try {
      await api.post('/tasks', {
        title: typeof item === 'string' ? item : item.title,
        priority: item.priority || 'Medium',
        owner: item.owner || 'Unassigned',
      });
      setSyncedMap((prev) => ({ ...prev, [index]: true }));
      setToastMessage('Task added to board!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-semibold">
                AI Meeting Intelligence
              </p>
              <h2 className="mt-1 text-3xl font-semibold text-white">{summary.title}</h2>
              <p className="mt-1 text-sm text-slate-400">
                Automated executive summary, decision log, and smart action item extraction
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {toastMessage && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3.5 py-2 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{toastMessage}</span>
                </div>
              )}

              <button
                onClick={loadSummary}
                disabled={summary.status === 'loading'}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 transition"
              >
                <RefreshCw className={`h-4 w-4 ${summary.status === 'loading' ? 'animate-spin' : ''}`} />
                Regenerate
              </button>

              <button
                onClick={downloadMarkdown}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 shadow-md shadow-violet-600/20 transition"
              >
                <Download className="h-4 w-4" />
                Export Markdown
              </button>
            </div>
          </div>
        </div>

        {/* Input / Transcript Selector Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-400" />
              Meeting Transcript / Discussion Source
            </label>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Load sample:</span>
              <button
                onClick={() => {
                  setMeetingTitle('Launch readiness recap');
                  setTranscript(SAMPLE_TRANSCRIPTS.launch);
                }}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700"
              >
                Launch Sync
              </button>
              <button
                onClick={() => {
                  setMeetingTitle('Sprint 42 Kickoff');
                  setTranscript(SAMPLE_TRANSCRIPTS.sprint);
                }}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700"
              >
                Sprint Kickoff
              </button>
              <button
                onClick={() => {
                  setMeetingTitle('Customer Discovery Call');
                  setTranscript(SAMPLE_TRANSCRIPTS.sales);
                }}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700"
              >
                Customer Call
              </button>
            </div>
          </div>

          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your meeting transcript or discussion points here..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-200 outline-none focus:border-violet-500 placeholder:text-slate-600 leading-relaxed font-mono"
          />
        </div>

        {/* Output Grid */}
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          {/* Left Column: Executive Summary & Decisions */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <h3 className="text-xl font-semibold text-white">Executive Summary</h3>
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-5 text-sm leading-7 text-slate-200">
                {summary.summary || 'Generating a summary…'}
              </div>
            </div>

            {/* Key Points */}
            <div>
              <h4 className="mb-3 font-semibold text-slate-200 text-sm tracking-wide uppercase text-violet-400">
                Key Discussion Points
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-300">
                {(summary.keyPoints || []).length === 0 ? (
                  <li className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-slate-400 text-xs">
                    No key points available yet.
                  </li>
                ) : (
                  (summary.keyPoints || []).map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-xs leading-relaxed text-slate-200">{item}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Decisions Made */}
            <div>
              <h4 className="mb-3 font-semibold text-slate-200 text-sm tracking-wide uppercase text-violet-400">
                Decisions Made
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-300">
                {(summary.decisions || []).length === 0 ? (
                  <li className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-slate-400 text-xs">
                    No decisions captured yet.
                  </li>
                ) : (
                  (summary.decisions || []).map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3.5"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-violet-400 shrink-0" />
                      <span className="text-xs leading-relaxed text-slate-200">
                        {typeof item === 'string' ? item : item.title || item}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Right Column: Smart Action Items & Sync */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-violet-400" />
                  <h3 className="text-xl font-semibold text-white">Action Items</h3>
                </div>

                <button
                  onClick={syncAllActionItems}
                  disabled={isSyncingAll || !summary.actionItems?.length}
                  className="rounded-xl bg-violet-600/30 border border-violet-500/40 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-600/50 transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {isSyncingAll ? 'Syncing...' : 'Sync All to Board'}
                </button>
              </div>

              <div className="space-y-3">
                {(summary.actionItems || []).length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-center text-xs text-slate-400">
                    No action items detected yet.
                  </div>
                ) : (
                  (summary.actionItems || []).map((item, idx) => {
                    const isSynced = syncedMap[idx];
                    const itemTitle = typeof item === 'string' ? item : item.title;
                    const priority = item.priority || 'Medium';
                    const owner = item.owner || 'Unassigned';
                    const deadline = item.deadline || 'This week';

                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 p-3.5 transition hover:border-slate-700"
                      >
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-100 leading-snug">{itemTitle}</p>
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                            <span
                              className={`rounded px-1.5 py-0.5 font-bold ${
                                priority === 'High'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : priority === 'Medium'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {priority}
                            </span>
                            <span>•</span>
                            <span className="text-slate-300">{owner}</span>
                            <span>•</span>
                            <span className="text-slate-400">{deadline}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => syncSingleActionItem(item, idx)}
                          disabled={isSynced}
                          className={`rounded-xl p-2 transition ${
                            isSynced
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                              : 'text-slate-400 hover:text-violet-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                          title={isSynced ? 'Added to Tasks' : 'Add to Tasks'}
                        >
                          {isSynced ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pipeline Status */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Engine Status</p>
              <div
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  summary.status === 'ready'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {statusLabel}
              </div>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                Powered by IntellMeet's LLM pipeline with auto-structured executive summaries, decision tagging, and smart action item syncing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
