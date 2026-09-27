import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'AnimeClips AI — Turn Long Videos Into Shorts',
  description:
    'AI-powered video clipping and editing for anime, gaming, podcasts, tutorials, and long-form content. Upload a video, find the best moments, reframe to vertical, add captions, and export short clips.',
  openGraph: {
    title: 'AnimeClips AI — Turn Long Videos Into Shorts',
    description:
      'Turn long anime episodes and videos into viral vertical shorts automatically with scene detection, motion scoring, and 9:16 reframing.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnimeClips AI — Turn Long Videos Into Shorts',
    description: 'Transform long-form anime into high-action vertical short clips.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#08090e] text-slate-100 flex flex-col antialiased selection:bg-brand-cyan/20 selection:text-brand-cyan">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
