// src/components/member/MemberLayout.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Heart, PersonStanding, User, Star, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/mon-espace' },
  { label: 'Mes événements', icon: Users, path: '/mon-espace/evenements' },
  { label: 'Bilans bien-être', icon: Heart, path: '/mon-espace/historique' },
  { label: 'Run Club', icon: PersonStanding, path: '/mon-espace/run-club' },
  { label: 'Mon profil', icon: User, path: '/mon-espace/profil' },
  { label: 'Abonnement', icon: Star, path: '/mon-espace/abonnement' },
];

const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Membre';
  const initials = displayName.slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  return (
    <div className="flex min-h-screen bg-[#faf9f7]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-black/[0.08] flex flex-col py-9 flex-shrink-0">
        {/* Logo */}
        <Link
          to="/"
          className="px-7 mb-8 font-display font-light text-[20px] tracking-[0.28em] uppercase text-black block"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </Link>

        {/* User avatar */}
        <div className="px-7 mb-8">
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#1e3a1e] to-[#3d6b3e] flex items-center justify-center mb-3">
            <span
              className="text-white text-[22px] font-light"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {initials}
            </span>
          </div>
          <p className="text-[14px] font-normal text-black capitalize">{displayName}</p>
          <span className="inline-block text-[8px] tracking-[0.2em] uppercase bg-[#3d6b3e] text-white px-[7px] py-[2px] rounded-[3px] mt-1">
            Premium
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4" aria-label="Navigation membre">
          {NAV.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-[11px] px-3 py-[10px] rounded-lg mb-1 text-[12px] transition-colors ${
                  active
                    ? 'bg-[#f0f0ee] text-black font-normal'
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
        </nav>

        {/* Logout */}
        <div className="px-4 mt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-[11px] px-3 py-[10px] rounded-lg text-[12px] text-black/35 hover:text-black transition-colors w-full font-light"
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
