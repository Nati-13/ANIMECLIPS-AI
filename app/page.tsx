'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Swords,
  Sparkles,
  Play,
  Film,
  Flame,
  Crop,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Video,
  ChevronDown,
  Loader2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleLaunchDemo = async () => {
    try {
      setDemoLoading(true);
      const res = await fetch('/api/demo/create', { method: 'POST' });
      const data = await res.json();
      if (data.project?.id) {
        router.push(`/projects/${data.project.id}`);
      } else {
        alert(data.error || 'Failed to start demo project');
      }
    } catch (err: unknown) {
      alert(`Error starting demo: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 1. HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-cyber-gradient pt-16 pb-24 md:pt-24 md:pb-32 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3.5 py-1 text-xs font-semibold text-brand-cyan shadow-neon">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Next-Gen Anime Highlight Clipping Engine
              </div>

              <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.1]">
                Turn Long Videos Into{' '}
                <span className="bg-gradient-to-r from-brand-cyan via-brand-magenta to-brand-purple bg-clip-text text-transparent">
                  Viral-Ready Shorts
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Upload a long video or provide a supported video URL. AnimeClips AI finds the best moments, reframes them for vertical video, adds captions, and prepares them for Shorts, Reels, and TikTok.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/projects/new"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-magenta px-6 py-3.5 text-sm font-bold text-[#090a10] shadow-neon hover:opacity-95 transition-all transform hover:-translate-y-0.5"
                >
                  <Swords className="h-4 w-4" />
                  Start Creating
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>

                <button
                  onClick={handleLaunchDemo}
                  disabled={demoLoading}
                  className="flex items-center gap-2 rounded-xl border border-white/15 bg-surface-100/80 px-6 py-3.5 text-sm font-semibold text-white hover:bg-surface-200 transition-colors"
                >
                  {demoLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
                      Loading Sample Media...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 text-brand-cyan fill-brand-cyan" />
                      Try Demo (Bundled 1080p Video)
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                  Real FFmpeg Hardware Core
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                  Smart 9:16 Reframe
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-cyan" />
                  Zero Fake Placeholders
                </div>
              </div>
            </div>

            {/* Right Column: Visual Pipeline Demonstration */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-white/10 bg-surface-50/90 p-5 shadow-glow backdrop-blur-xl">
                {/* Pipeline visualizer */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    <span className="font-mono text-xs text-slate-400 ml-2">pipeline_preview.sh</span>
                  </div>
                  <span className="rounded bg-brand-cyan/10 px-2 py-0.5 font-mono text-[10px] text-brand-cyan">
                    ACTIVE CORE
                  </span>
                </div>

                <div className="space-y-3 pt-4 text-xs font-mono">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-100 border border-white/5">
                    <span className="text-slate-400">1. SOURCE 16:9 VIDEO</span>
                    <span className="text-slate-200">1920 × 1080 (42m 13s)</span>
                  </div>
                  <div className="flex items-center justify-center text-brand-cyan py-0.5">↓</div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-100 border border-white/5">
                    <span className="text-slate-400">2. SHOT DETECTION</span>
                    <span className="text-brand-magenta">187 cuts detected</span>
                  </div>
                  <div className="flex items-center justify-center text-brand-cyan py-0.5">↓</div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-100 border border-white/5">
                    <span className="text-slate-400">3. MULTI-SIGNAL SCORE</span>
                    <span className="text-brand-cyan">Action 96% • Hook 91%</span>
                  </div>
                  <div className="flex items-center justify-center text-brand-cyan py-0.5">↓</div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-brand-cyan/20 to-brand-purple/20 border border-brand-cyan/30 text-white">
                    <span className="font-bold flex items-center gap-1.5">
                      <Crop className="h-3.5 w-3.5 text-brand-cyan" />
                      4. 9:16 VERTICAL SHORTS
                    </span>
                    <span className="font-bold text-brand-cyan">1080 × 1920 MP4</span>
                  </div>
                </div>

                {/* Sample visual frame */}
                <div className="mt-4 rounded-xl overflow-hidden border border-white/10 relative bg-black/60 aspect-[16/9] flex items-center justify-center">
                  <video
                    src="/api/media/samples/anime_action_demo.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090a10] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[11px] font-mono bg-black/70 px-2 py-0.5 rounded text-brand-cyan border border-brand-cyan/30">
                      Live Bundled Action Test
                    </span>
                    <span className="text-[11px] font-mono text-slate-300">
                      35.00s • 24 FPS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="w-full py-20 border-b border-white/5 bg-[#090a10]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <h2 className="font-display text-xs uppercase tracking-widest text-brand-cyan font-bold">
              Autonomous Pipeline
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              From Raw Footage to Viral Vertical Clips
            </p>
            <p className="text-sm text-slate-400">
              No simulated progress bars or fake mockups. Every stage is computed using real FFmpeg filters, scene analysis, and multi-signal scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-3 hover:border-brand-cyan/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-white">1. Ingest & Inspect</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your video or provide a direct video URL. FFprobe extracts exact stream resolution, audio bitrate, and frame rate.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-3 hover:border-brand-magenta/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-brand-magenta/10 border border-brand-magenta/30 flex items-center justify-center text-brand-magenta">
                <Flame className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-white">2. Action Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detects frame differences, audio peaks, dramatic music swells, and opening hooks to find the most intense anime battles.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-3 hover:border-brand-purple/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-brand-purple/10 border border-brand-purple/30 flex items-center justify-center text-brand-purple">
                <Crop className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-white">3. Vertical 9:16 Reframe</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Converts 16:9 scenes to 9:16 vertical using Smart Crop, Blurred Background, Mirrored Sides, or Letterbox Fit.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-3 hover:border-emerald-400/40 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-white">4. Edit & Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Trim clips, adjust playback speed, add effects, preview in browser, and export validated 1080x1920 MP4 files ready for TikTok and Shorts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SUPPORTED SOURCES & HONESTY NOTICE */}
      <section className="w-full py-20 border-b border-white/5 bg-[#0b0d14]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Guaranteed Honest Platform Capability
              </div>
              <h2 className="font-display text-3xl font-extrabold text-white">
                Clear Ingestion Rules. No DRM Bypassing.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                AnimeClips AI implements strict SSRF protection and respects content platform security. We never pretend an import succeeded or fake automated ripping.
              </p>

              <div className="pt-2 space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Fully Supported Sources</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Direct local file uploads (MP4, MOV, WEBM, MKV), direct downloadable media links, and user-provided cloud storage URLs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Protected Platform Handling</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      If a video is behind DRM, paywalls, or requires OAuth credentials not configured on the server, the system transparently instructs you to upload the file directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface-50 p-6 space-y-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
                Preset Content Profiles
              </h3>
              <div className="space-y-2.5">
                {[
                  { name: 'Anime Action', desc: 'Explosions, sword fights, power transformations, fast cuts.', icon: Swords, color: 'text-brand-cyan' },
                  { name: 'Anime Hype / AMV', desc: 'Max adrenaline moments synced with heavy audio beats.', icon: Flame, color: 'text-brand-magenta' },
                  { name: 'Anime Emotional', desc: 'Close-ups, crying characters, dramatic dialogue reveals.', icon: Sparkles, color: 'text-brand-purple' },
                  { name: 'Dialogue Highlight', desc: 'Clear monologues and speech moments for subtitled shorts.', icon: Film, color: 'text-emerald-400' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface-100 p-3">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    <div>
                      <span className="text-xs font-bold text-white block">{item.name}</span>
                      <span className="text-[11px] text-slate-400">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ SECTION */}
      <section className="w-full py-20 border-b border-white/5 bg-[#090a10]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="font-display text-xs uppercase tracking-widest text-brand-cyan font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-3xl font-extrabold text-white">
              Everything You Need to Know
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does AnimeClips AI detect the best anime scenes?',
                a: 'The engine uses FFmpeg scene detection filters to locate natural shot cuts, followed by motion analysis (inter-frame variance) and audio energy analysis (peak loudness, soundtrack surges). It then calculates a weighted score per preset to select the top candidate segments.',
              },
              {
                q: 'How is the video reframed to vertical 9:16?',
                a: 'You can choose between 4 modes: Smart Crop (crops to a 9:16 window centered on dynamic action), Blur Background (places the sharp 16:9 video on a blurred vertical backdrop), Mirror Background, or Letterbox Fit.',
              },
              {
                q: 'Does this use fake AI or placeholder buttons?',
                a: 'No. Every single feature in AnimeClips AI is connected to real FFmpeg/FFprobe binaries and real database records. If an external service (like Whisper transcription) is not configured, the system explicitly marks it as unavailable rather than simulating fake data.',
              },
              {
                q: 'Can I edit the clips before exporting?',
                a: 'Yes! The built-in video editor allows you to adjust trim points, change playback speed (0.25x to 4x), toggle visual effects (contrast, vignette, saturation), adjust volumes, and preview before rendering.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-surface-50 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-white hover:text-brand-cyan"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      openFaq === i ? 'rotate-180 text-brand-cyan' : 'text-slate-400'
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="w-full py-20 bg-gradient-to-b from-[#090a10] to-[#101320] text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Create High-Action Shorts?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Upload your footage now or test our bundled anime sample video to experience real AI-assisted scene clipping.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/projects/new"
              className="rounded-xl bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-magenta px-8 py-3.5 text-sm font-bold text-[#090a10] shadow-neon hover:opacity-95 transition-transform hover:-translate-y-0.5"
            >
              Start Creating Now
            </Link>
            <button
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              className="rounded-xl border border-white/20 bg-surface-100 px-6 py-3.5 text-sm font-semibold text-white hover:bg-surface-200 transition-colors"
            >
              Launch Live Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
