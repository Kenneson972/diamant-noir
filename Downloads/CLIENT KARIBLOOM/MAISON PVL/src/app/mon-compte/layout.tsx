import Link from 'next/link';
import { PageSEO } from '@/components/common/PageSEO';

const ACCOUNT_LINKS = [
  { href: '/mon-compte', label: "Vue d'ensemble" },
  { href: '/mon-compte/commandes', label: 'Mes commandes' },
  { href: '/mon-compte/favoris', label: 'Mes favoris' },
  { href: '/mon-compte/adresses', label: 'Mes adresses' },
  { href: '/mon-compte/profil', label: 'Mon profil' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageSEO title="Mon compte" />
      <div className="container-pvl py-10 md:py-16">
        <h1 className="font-display text-2xl md:text-3xl mb-10">Mon compte</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <nav className="md:col-span-1">
            <div className="flex flex-col gap-1">
              {ACCOUNT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-pvl-slate hover:text-pvl-black transition-colors py-2 border-b border-pvl-black/6 last:border-0"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </>
  );
}
