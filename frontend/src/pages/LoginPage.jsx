import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: 'hello@northstar.io', password: 'Password123!' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-glow">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-violet-300">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold">Sign in</h2>
          </div>
          <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-300"><Shield className="h-5 w-5" /></div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Work email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none ring-0" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-transparent text-slate-100 outline-none" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="ml-2 text-slate-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>

          {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 font-medium text-white">
            Sign in <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
          <span>Need an account?</span>
          <Link to="/register" className="text-violet-300">Create one</Link>
        </div>
      </div>
    </div>
  );
}
