import { Link } from 'react-router-dom';
import { Instagram, MessageCircle } from 'lucide-react';

const MENU_LINKS = [
  { label: 'Shakes', to: '/menu' },
  { label: 'Gauffres', to: '/menu?category=gauffres' },
  { label: 'Carte complète', to: '/menu' },
];
const ESPACE_LINKS = [
  { label: 'Événements', to: '/evenements' },
  { label: 'Run Club', to: '/evenements?type=run-club' },
  { label: 'Bilan Bien-être', to: '/bilan-bien-etre' },
];
const CONTACT_LINKS = [
  { label: 'Instagram', to: 'https://instagram.com/pessora.mq', external: true },
  { label: 'WhatsApp', to: 'https://wa.me/596696000000', external: true },
  { label: 'Fort-de-France', to: '/contact' },
];

const FooterCol = ({ title, links }: { title: string; links: { label: string; to: string; external?: boolean }[] }) => (
  <div>
    <p className="text-[9px] font-normal tracking-[0.28em] uppercase text-white/25 mb-[14px]">{title}</p>
    {links.map((l) =>
      l.external ? (
        <a key={l.label} href={l.to} target="_blank" rel="noopener noreferrer" className="block text-[12px] text-white/50 mb-[9px] hover:text-white/80 transition-colors tracking-[0.03em]">
          {l.label}
        </a>
      ) : (
        <Link key={l.label} to={l.to} className="block text-[12px] text-white/50 mb-[9px] hover:text-white/80 transition-colors tracking-[0.03em]">
          {l.label}
        </Link>
      )
    )}
  </div>
);

const Footer = () => (
  <footer>
    <div className="bg-[#0a0a0a] px-[60px] pt-[52px] pb-7 grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-10">
      <div>
        <p
          className="font-display font-light text-[20px] tracking-[0.28em] uppercase text-white mb-[10px]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </p>
        <p className="text-[11px] text-white/28 leading-[1.8]">
          Bar protéiné<br />Fort-de-France, Martinique
        </p>
        <div className="flex gap-3 mt-5">
          <a href="https://instagram.com/pessora.mq" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition-colors">
            <Instagram size={16} strokeWidth={1.5} />
          </a>
          <a href="https://wa.me/596696000000" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition-colors">
            <MessageCircle size={16} strokeWidth={1.5} />
          </a>
        </div>
      </div>
      <FooterCol title="Menu" links={MENU_LINKS} />
      <FooterCol title="Espace" links={ESPACE_LINKS} />
      <FooterCol title="Contact" links={CONTACT_LINKS} />
    </div>
    <div className="bg-[#0a0a0a] border-t border-white/[0.07] px-[60px] py-4 flex justify-between">
      <span className="text-[10px] text-white/18 tracking-[0.08em]">© {new Date().getFullYear()} Pessóra</span>
      <div className="flex gap-6">
        <Link to="/mentions-legales" className="text-[10px] text-white/18 hover:text-white/40 transition-colors tracking-[0.08em]">Mentions légales</Link>
        <Link to="/cgv" className="text-[10px] text-white/18 hover:text-white/40 transition-colors tracking-[0.08em]">CGV</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
