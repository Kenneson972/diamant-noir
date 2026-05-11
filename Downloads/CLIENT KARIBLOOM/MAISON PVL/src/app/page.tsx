import Link from 'next/link';

export default function EntryPage() {
  return (
    <div className="grid grid-cols-2 h-screen">
      {/* Homme */}
      <Link
        href="/homme"
        className="relative flex items-end p-12 md:p-16 overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, #5a4c3a 0%, #3a2c1a 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/50" />
        <span className="relative z-10 font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[0.9] tracking-[-0.02em] transition-transform duration-500 group-hover:translate-y-[-4px]">
          Homme
        </span>
      </Link>

      {/* Femme */}
      <Link
        href="/femme"
        className="relative flex items-end p-12 md:p-16 overflow-hidden group"
        style={{
          background: 'linear-gradient(135deg, #948575 0%, #746555 100%)',
        }}
      >
        <div className="absolute inset-0 bg-radial from-transparent to-black/50" />
        <span className="relative z-10 font-display text-[clamp(2rem,5vw,3.5rem)] text-white leading-[0.9] tracking-[-0.02em] transition-transform duration-500 group-hover:translate-y-[-4px]">
          Femme
        </span>
      </Link>
    </div>
  );
}
