import React from 'react';
import Link from 'next/link';
import { Swords, ShieldAlert, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#07080c] py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-magenta to-brand-cyan p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-[#0d0e17]">
                  <Swords className="h-3.5 w-3.5 text-brand-cyan" />
                </div>
              </div>
              <span className="font-display font-bold tracking-wider text-white">
                ANIMECLIPS.AI
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Automated high-energy short-form video generator. Detects action scenes, visual climaxes, and audio peaks in long-form anime and videos, reframing them to vertical 9:16 for Shorts, Reels, and TikTok.
            </p>
            {/* Responsible Content Notice (Requirement #78) */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/90 max-w-lg">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Notice:</strong> Users are responsible for ensuring that they have the necessary rights or permissions to upload, edit, and distribute the videos they process.
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Workflow</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/dashboard" className="hover:text-brand-cyan transition-colors">Projects Dashboard</Link></li>
              <li><Link href="/projects/new" className="hover:text-brand-cyan transition-colors">Create Short Clips</Link></li>
              <li><Link href="/settings/capabilities" className="hover:text-brand-cyan transition-colors">Engine Capabilities</Link></li>
              <li><Link href="/admin/system" className="hover:text-brand-cyan transition-colors">System Diagnostics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-brand-cyan" /> FFmpeg 9.0.1 Hardware Video Core</li>
              <li className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-brand-magenta" /> Multi-Signal Anime Motion Analyzer</li>
              <li className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-brand-purple" /> SSRF-Guarded Safe Media Ingestion</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} AnimeClips AI. Built with Next.js & FFmpeg Media Core.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span>9:16 Vertical Output</span>
            <span>•</span>
            <span>H.264 / AAC Encoding</span>
            <span>•</span>
            <span>Honest Engine Reporting</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
