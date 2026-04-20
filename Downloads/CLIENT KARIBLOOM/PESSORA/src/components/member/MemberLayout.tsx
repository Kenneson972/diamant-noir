// src/components/member/MemberLayout.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Heart, User, Star, LogOut, Shield, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  /** Même layout pour `/mon-espace/*` et `/demo-espace/*` — les liens doivent rester sur le bon préfixe. */
  const prefix = location.pathname.startsWith('/demo-espace') ? '/demo-espace' : '/mon-espace';

  const NAV = [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: prefix },
    { label: 'Mes événements', icon: Users, path: `${prefix}/evenements` },
    { label: 'Mes commandes', icon: ShoppingBag, path: `${prefix}/historique` },
    { label: 'Réserver un bilan', icon: Heart, path: '/bilan-bien-etre' },
    { label: 'Mon profil', icon: User, path: `${prefix}/profil` },
    { label: 'Abonnement', icon: Star, path: `${prefix}/abonnement` },
  ];

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Membre';
  const initials = displayName.slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-black/[0.08] flex flex-col py-9 flex-shrink-0">
        {/* Logo */}
        <Link to="/" className="px-7 mb-8 block">
          <BrandLogo height={40} />
        </Link>

        {/* User avatar */}
        <div className="px-7 mb-8">
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-anthracite to-noir flex items-center justify-center mb-3">
            <span
              className="text-white text-[22px] font-light"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {initials}
            </span>
          </div>
          <p className="text-[14px] font-normal text-black capitalize">{displayName}</p>
          <span className="inline-block text-[8px] tracking-[0.2em] uppercase bg-noir text-white px-[7px] py-[2px] rounded-[3px] mt-1">
            Premium
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4" aria-label="Navigation membre">
          {NAV.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={`${item.label}-${item.path}`}
                to={item.path}
                className={`flex items-center gap-[11px] px-3 py-[10px] rounded-[2px] mb-1 text-[12px] transition-colors ${
                  active
                    ? 'bg-black/[0.04] text-black font-normal'
                    : 'text-black/55 hover:bg-black/[0.04] hover:text-black font-light'
                }`}
              >
                <item.icon
                  size={16}
                  strokeWidth={1.5}
                  className={active ? 'text-black' : 'text-black/60'}
                />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-[11px] px-3 py-[10px] rounded-[2px] mb-1 text-[12px] transition-colors ${
                location.pathname.startsWith('/admin')
                  ? 'bg-black/[0.04] text-black font-normal'
                  : 'text-black/55 hover:bg-black/[0.04] hover:text-black font-light'
              }`}
            >
              <Shield size={16} strokeWidth={1.5} className={location.pathname.startsWith('/admin') ? 'text-black' : 'text-black/60'} aria-hidden />
              Administration
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="px-4 mt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-[11px] px-3 py-[10px] rounded-[2px] text-[12px] text-black/35 hover:text-black transition-colors w-full font-light"
          >
            <LogOut size={16} strokeWidth={1.5} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-[40px]">
        {children}
      </main>
    </div>
  );
};

export default MemberLayout;
