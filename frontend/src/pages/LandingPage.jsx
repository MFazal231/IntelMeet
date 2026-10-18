import { ArrowRight, CheckCircle2, Mic, ShieldCheck, Sparkles, Video, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: Video, title: 'Video meetings', description: 'High-quality rooms with structured agenda flow, handoff notes, and live recap support.' },
  { icon: Wand2, title: 'AI summaries', description: 'Transform discussion into key decisions, action items, and follow-up owners automatically.' },
  { icon: Sparkles, title: 'Live collaboration', description: 'Keep chat, notes, task ownership, and meeting artifacts synchronized in one workspace.' },
  { icon: CheckCircle2, title: 'Action items', description: 'Track to-dos, owners, deadlines, and follow-up status with shared visibility.' },
];

const steps = [
  'Create your workspace and invite the right people.',
  'Launch a meeting, share screens, and capture live discussion.',
  'Approve AI notes and turn outcomes into tasks and owners.',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
            <Video className="h-5 w-5" />
          </div>
          <p className="text-xl font-semibold">IntellMeet</p>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#security">Security</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200">Sign in</Link>
          <Link to="/register" className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white">Get started</Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
              <Sparkles className="h-4 w-4" />
              AI-powered collaboration for modern teams
            </div>
            <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">Meet smarter. Collaborate better.</h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">Run fully coordinated meetings with real-time video, indexed notes, action items, and secure workspaces for teams that want to move from discussion to delivery.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-medium text-white shadow-glow">
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-200">Explore features</a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-glow">
            <div className="rounded-2xl bg-slate-950 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Live room</p>
                  <p className="mt-1 text-lg font-semibold">Executive planning sync</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                    <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 via-slate-900 to-slate-900 text-slate-400">
                      <Video className="h-8 w-8" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Person {item}</span>
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
                <div className="flex items-center gap-2"><Mic className="h-4 w-4" /> 1:08:34</div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Secure room</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Platform features</p>
            <h2 className="mt-3 text-3xl font-semibold">Tools designed for focus, clarity, and execution.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="mb-4 inline-flex rounded-xl bg-violet-500/15 p-2 text-violet-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold">From conversation to action in one flow.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step} className="rounded-2xl bg-slate-950/70 p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20 text-violet-200">0{index + 1}</div>
                  <p className="text-base text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Privacy and security</p>
              <h3 className="mt-3 text-3xl font-semibold">Built for trusted collaboration.</h3>
              <p className="mt-4 text-slate-300">IntellMeet keeps meetings, notes, and workspaces isolated by access control and secure-by-default configuration. AI summaries only run when credentials are configured and consent is present.</p>
            </div>
            <div className="grid gap-4">
              {[
                'Workspace-level membership checks and authorization',
                'Secure token handling for protected routes',
                'Environment-based secrets and no hardcoded credentials',
                'Documented limitations for video and AI providers',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                  <p className="text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer id="pricing" className="border-t border-slate-800 bg-slate-950/90">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold">IntellMeet</p>
              <p className="text-sm text-slate-400">AI-powered meeting and collaboration platform</p>
            </div>
            <div className="flex gap-6 text-sm text-slate-300">
              <a href="#features">Features</a>
              <a href="#workflow">Workflow</a>
              <a href="#security">Security</a>
              <a href="mailto:hello@intellmeet.app">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
