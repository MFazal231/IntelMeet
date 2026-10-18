import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, FileText, RefreshCw, Sparkles } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import api from '../services/api.js';

const defaultTranscript = `Quarterly planning recap. We aligned on onboarding improvements, product launch sequencing, and customer-facing demo readiness. The team agreed to finalize the release checklist before Friday and keep security validation as a gating item.`;

function normalizeSummaryData(data = {}) {
  const keyPoints = Array.isArray(data.keyPoints) ? data.keyPoints : [];
  const decisions = Array.isArray(data.decisions) ? data.decisions : [];
  const actionItems = Array.isArray(data.actionItems) ? data.actionItems : [];

  return {
    status: data.status || 'ready',
    title: data.title || 'Launch readiness recap',
    summary: data.summary || 'AI summary is being generated.',
    keyPoints,
    decisions,
    actionItems,
  };
}

export default function AiNotesPage() {
  const [summary, setSummary] = useState({
    status: 'loading',
    title: 'Launch readiness recap',
    summary: '',
    keyPoints: [],
    decisions: [],
    actionItems: [],
  });

  const statusLabel = useMemo(() => {
    if (summary.status === 'loading') return 'Generating';
    if (summary.status === 'error' || summary.status === 'unavailable') return 'Pending configuration';
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
      ...(summary.keyPoints.length ? summary.keyPoints.map((item) => `- ${item}`) : ['- No key points captured yet.']),
      '',
      '## Decisions',
      ...(summary.decisions.length ? summary.decisions.map((item) => `- ${item}`) : ['- No decisions captured yet.']),
      '',
      '## Action Items',
      ...(summary.actionItems.length ? summary.actionItems.map((item) => `- ${item}`) : ['- No action items captured yet.']),
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
        title: 'Launch readiness recap',
        transcript: defaultTranscript,
      });
      const normalized = normalizeSummaryData(response.data);
      setSummary({ ...normalized, status: normalized.status || 'ready' });
    } catch (error) {
      setSummary({
        status: 'error',
        title: 'Launch readiness recap',
        summary: 'AI summary is unavailable right now. Please verify the API configuration.',
        keyPoints: [],
        decisions: [],
        actionItems: [],
      });
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">AI meeting notes</p>
              <h2 className="mt-2 text-3xl font-semibold">{summary.title}</h2>
            </div>
            <div className="flex gap-3">
              <button onClick={loadSummary} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200"><RefreshCw className="h-4 w-4" /> Regenerate</button>
              <button onClick={downloadMarkdown} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm text-white"><Download className="h-4 w-4" /> Download</button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-300" /> <h3 className="text-xl font-semibold">Executive summary</h3></div>

            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm leading-7 text-slate-200">
              {summary.summary || 'Generating a summary…'}
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <h4 className="mb-2 font-medium text-slate-200">Key points</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  {(summary.keyPoints || []).length === 0 ? (
                    <li className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-slate-400">No key points available yet.</li>
                  ) : (
                    (summary.keyPoints || []).map((item) => (
                      <li key={item} className="flex gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" /> <span>{item}</span></li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-slate-200">Decisions made</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  {(summary.decisions || []).length === 0 ? (
                    <li className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-slate-400">No decisions captured yet.</li>
                  ) : (
                    (summary.decisions || []).map((item) => (
                      <li key={item} className="flex gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-violet-300" /> <span>{item}</span></li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-violet-300" /> <h3 className="text-xl font-semibold">Action items</h3></div>
              <ul className="space-y-3 text-sm text-slate-300">
                {(summary.actionItems || []).length === 0 ? (
                  <li className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-slate-400">No action items detected yet.</li>
                ) : (
                  (summary.actionItems || []).map((item) => (
                    <li key={item} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">{item}</li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Status</p>
              <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs ${summary.status === 'ready' ? 'bg-emerald-500/15 text-emerald-300' : summary.status === 'unavailable' || summary.status === 'error' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-700/80 text-slate-200'}`}>
                {statusLabel}
              </div>
              <p className="mt-3 text-sm text-slate-300">AI notes status: {summary.status || 'loading'}</p>
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
                Generated from the live Gemini-backed summary endpoint with structured meeting output.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
