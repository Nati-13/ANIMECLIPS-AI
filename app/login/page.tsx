'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Swords, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-surface-50 p-8 shadow-glow backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-magenta to-brand-cyan p-0.5 shadow-neon">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0d0e17]">
              <Swords className="h-6 w-6 text-brand-cyan" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-400">
            Sign in to access your video clipping workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@animeclips.ai"
                className="w-full rounded-xl border border-white/10 bg-surface-100 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-cyan focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-surface-100 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-cyan focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple py-3 text-sm font-bold text-[#090a10] shadow-neon hover:opacity-95 transition-opacity"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="rounded-xl border border-white/5 bg-surface-100/50 p-3 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>RLS & Supabase Auth Protected Workspace</span>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand-cyan font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
