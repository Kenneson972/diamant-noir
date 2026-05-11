import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HommePage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative h-screen flex items-end p-12 md:p-20"
        style={{ background: 'linear-gradient(135deg, #5a4c3a 0%, #3a2c1a 100%)' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        <div className="relative z-10">
          <p className="text-[0.5625rem] uppercase tracking-[0.3em] text-white/40 mb-4">
            Nouveaut&eacute;s &Eacute;t&eacute; 2026
          </p>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] text-white leading-[0.95] tracking-[-0.02em]">
            L&apos;allure<br />masculine
          </h1>
          <div className="mt-10 flex gap-6">
            <Link
              href="/homme/nouveautes"
              className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
            >
              Nouveaut&eacute;s{' '}
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/homme/essentiels"
              className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
            >
              Essentiels{' '}
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Block 2 */}
      <section
        className="relative h-screen flex items-end p-12 md:p-20"
        style={{ background: 'linear-gradient(135deg, #8b7d6b 0%, #5a4c3a 100%)' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        <div className="relative z-10 max-w-xl">
          <p className="text-[0.5625rem] uppercase tracking-[0.3em] text-white/40 mb-4">
            Essentiels
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[1.05] tracking-[-0.01em]">
            La chemise<br />parfaite
          </h2>
          <Link
            href="/homme/essentiels"
            className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 mt-8 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
          >
            D&eacute;couvrir{' '}
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>

      {/* Block 3 */}
      <section
        className="relative h-screen flex items-end p-12 md:p-20"
        style={{ background: 'linear-gradient(135deg, #6b5d4b 0%, #4a3c2a 100%)' }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        <div className="relative z-10 max-w-xl ml-auto text-right">
          <p className="text-[0.5625rem] uppercase tracking-[0.3em] text-white/40 mb-4">
            Silhouettes
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[1.05] tracking-[-0.01em]">
            L&apos;art de<br />la coupe
          </h2>
          <Link
            href="/homme/silhouettes"
            className="group inline-flex items-center gap-3 border-b border-white/30 pb-2 mt-8 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/60 transition-all duration-300"
          >
            D&eacute;couvrir{' '}
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
    </>
  );
}
