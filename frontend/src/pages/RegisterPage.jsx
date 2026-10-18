import { useState } from 'react';
import { ArrowRight, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: 'Alicia Park', email: 'alicia@northstar.io', password: 'Password123!' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-glow">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Join the team</p>
            <h2 className="mt-2 text-3xl font-semibold">Create account</h2>
          </div>
          <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-300"><UserPlus className="h-5 w-5" /></div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Full name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Work email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none" />
          </div>

          {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 font-medium text-white">
            Create account <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
          <span>Already have an account?</span>
          <Link to="/login" className="text-violet-300">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
