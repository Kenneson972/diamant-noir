import { Link } from 'react-router-dom';
import { Instagram, MessageCircle } from 'lucide-react';

const MENU_LINKS = [
  { label: 'Shakes', to: '/menu' },
  { label: 'Gauffres', to: '/menu?category=gauffres' },
  { label: 'Carte complète', to: '/menu' },
];
const ESPACE_LINKS = [
  { label: 'Événements', to: '/evenements' },
  { label: 'Bilan Bien-être', to: '/bilan-bien-etre' },
];
const CONTACT_LINKS = [
  { label: 'Instagram', to: 'https://instagram.com/pessora.mq', external: true },
  { label: 'WhatsApp', to: 'https://wa.me/596696000000', external: true },
  { label: 'Fort-de-France', to: '/contact' },
];

const FooterCol = ({ title, links }: { title: string; links: { label: string; to: string; external?: boolean }[] }) => (
  <div>
    <p className="mb-5 text-[8px] font-light uppercase tracking-[0.45em] text-white/35">{title}</p>
    {links.map((l) =>
      l.external ? (
        <a key={l.label} href={l.to} target="_blank" rel="noopener noreferrer"
          className="mb-[11px] block text-[11px] font-light tracking-[0.04em] text-white/52 transition-colors duration-200 hover:text-white/80">
          {l.label}
        </a>
      ) : (
        <Link key={l.label} to={l.to}
          className="mb-[11px] block text-[11px] font-light tracking-[0.04em] text-white/52 transition-colors duration-200 hover:text-white/80">
          {l.label}
        </Link>
      )
    )}
  </div>
);

const Footer = () => (
  <footer>
    <div className="grid grid-cols-1 gap-10 bg-[oklch(8%_0.005_55)] px-4 pb-8 pt-14 sm:grid-cols-2 md:px-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12 lg:px-[72px] lg:pt-[64px]">
      <div>
        <p
          className="mb-3 font-display text-[18px] font-normal uppercase tracking-[0.32em] text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </p>
        <p className="text-[10px] font-light leading-[2.1] tracking-[0.04em] text-white/40">
          Bar protéiné<br />Fort-de-France, Martinique
        </p>
        <div className="mt-7 flex gap-4">
          <a href="https://instagram.com/pessora.mq" target="_blank" rel="noopener noreferrer"
            className="text-white/38 transition-colors duration-200 hover:text-white/65">
            <Instagram size={15} strokeWidth={1.3} />
          </a>
          <a href="https://wa.me/596696000000" target="_blank" rel="noopener noreferrer"
            className="text-white/38 transition-colors duration-200 hover:text-white/65">
            <MessageCircle size={15} strokeWidth={1.3} />
          </a>
        </div>
      </div>
      <FooterCol title="Menu" links={MENU_LINKS} />
      <FooterCol title="Espace" links={ESPACE_LINKS} />
      <FooterCol title="Contact" links={CONTACT_LINKS} />
    </div>
    <div className="flex items-center justify-between border-t border-white/[0.06] bg-[oklch(8%_0.005_55)] px-4 py-5 md:px-10 lg:px-[72px]">
      <span className="text-[9px] font-light tracking-[0.1em] text-white/28">© {new Date().getFullYear()} Pessóra · Fort-de-France</span>
      <div className="flex gap-7">
        <Link to="/mentions-legales" className="text-[9px] font-light tracking-[0.1em] text-white/28 transition-colors duration-200 hover:text-white/52">Mentions légales</Link>
        <Link to="/cgv" className="text-[9px] font-light tracking-[0.1em] text-white/28 transition-colors duration-200 hover:text-white/52">CGV</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
