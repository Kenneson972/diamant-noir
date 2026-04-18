import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Badge } from '@heroui/react';
import { Search, User, ShoppingBag, UtensilsCrossed, Users, Heart, PersonStanding, CalendarDays, Menu as MenuIcon, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_CATS = [
  { label: 'Shakes', icon: UtensilsCrossed, path: '/menu' },
  { label: 'Gauffres', icon: UtensilsCrossed, path: '/menu?category=gauffres' },
  { label: 'Événements', icon: Users, path: '/evenements' },
  { label: 'Bilan', icon: Heart, path: '/bilan-bien-etre' },
  { label: 'Run Club', icon: PersonStanding, path: '/evenements?type=run-club' },
  { label: 'Réserver', icon: CalendarDays, path: '/bilan-bien-etre?tab=reservation' },
] as const;

const Header = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCat = NAV_CATS.find((c) => {
    const [basePath] = c.path.split('?');
    if (c.path.includes('?')) {
      return location.pathname + location.search === c.path;
    }
    return location.pathname === basePath || location.pathname.startsWith(basePath + '/');
  });

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-black/10 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Rangée 1 */}
      <div className="px-12 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link
          to="/"
          className="font-display font-light text-[22px] tracking-[0.28em] uppercase text-black flex-shrink-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </Link>

        {/* Search — v3 Input is a bare <input>, wrap with a styled div */}
        <div className="flex-1 flex justify-center">
          <div className="relative max-w-[440px] w-full">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-black/35 pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Shakes, gauffres, événements…"
              className="w-full h-9 rounded-full border border-black/[0.18] bg-white pl-9 pr-4 text-[12px] text-black/40 placeholder:text-black/40 outline-none focus:border-black/30 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Mon Espace — Button v3 has no `as` prop, wrap in Link */}
          <Link
            to={isAuthenticated ? '/mon-espace' : '/connexion'}
            className="inline-flex items-center gap-1.5 h-8 rounded-full border border-black px-3.5 text-[11px] tracking-[0.08em] text-black font-normal hover:bg-black/[0.04] transition-colors"
          >
            <User size={15} strokeWidth={1.5} />
            Mon Espace
          </Link>

          {/* Cart with badge — v3 uses Badge.Anchor + Badge child */}
          <Badge.Anchor>
            <Button
              isIconOnly
              variant="outline"
              size="sm"
              className="w-9 h-9 min-w-0 rounded-full border-black/20"
              aria-label="Panier"
            >
              <ShoppingBag size={16} strokeWidth={1.5} />
            </Button>
            <Badge className="bg-black text-white" size="sm" placement="top-right">
              0
            </Badge>
          </Badge.Anchor>

          {/* Mobile menu toggle */}
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className="md:hidden"
            onPress={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} strokeWidth={1.5} /> : <MenuIcon size={22} strokeWidth={1.5} />}
          </Button>
        </div>
      </div>

      {/* Rangée 2 — desktop nav categories */}
      <nav aria-label="Catégories principales" className="hidden md:flex items-center justify-center border-t border-black/[0.07] h-[72px] px-12 gap-0">
        {NAV_CATS.map((cat) => {
          const isActive = cat === activeCat;
          return (
            <Link
              key={cat.label}
              to={cat.path}
              className={`flex flex-col items-center justify-center gap-[5px] px-6 h-14 rounded-lg transition-colors flex-shrink-0 ${
                isActive ? 'bg-[#f0f0ee]' : 'hover:bg-black/[0.04]'
              }`}
            >
              <cat.icon
                size={22}
                strokeWidth={1.3}
                className={isActive ? 'text-black' : 'text-black/65'}
              />
              <span
                className={`text-[11px] tracking-[0.02em] whitespace-nowrap ${
                  isActive ? 'text-black font-normal' : 'text-black/60 font-light'
                }`}
              >
                {cat.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-black/[0.07] bg-white px-6 py-4 flex flex-col gap-1">
          {NAV_CATS.map((cat) => (
            <Link
              key={cat.label}
              to={cat.path}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-[12px] text-black/65 border-b border-black/[0.06] last:border-0"
            >
              {cat.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;
