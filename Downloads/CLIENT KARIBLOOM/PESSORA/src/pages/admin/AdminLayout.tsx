// src/pages/admin/AdminLayout.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Package, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { label: "Vue d'ensemble", icon: LayoutDashboard, path: '/admin' },
  { label: 'Membres', icon: Users, path: '/admin/membres' },
  { label: 'Événements', icon: CalendarDays, path: '/admin/evenements' },
  { label: 'Produits', icon: Package, path: '/admin/produits' },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  return (
    <div className="flex min-h-screen bg-[oklch(98.5%_0.004_55)]">
      {/* Sidebar */}
      <aside className="w-[220px] bg-white border-r border-black/[0.06] flex flex-col py-8 flex-shrink-0">
        <Link
          to="/"
          className="px-6 mb-8 font-display font-normal text-[16px] tracking-[0.28em] uppercase text-black block"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Pessóra
        </Link>
        <p className="px-6 mb-6 text-[8px] font-normal uppercase tracking-[0.35em] text-black/30">
          Admin
        </p>

        <nav className="flex-1 px-3" aria-label="Navigation admin">
          {NAV.map((item) => {
            const active = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-[10px] px-3 py-[9px] rounded-[2px] mb-1 text-[11px] transition-colors ${
                  active
                    ? 'bg-black text-white font-normal'
                    : 'text-black/50 hover:bg-black/[0.04] hover:text-black font-light'
                }`}
              >
                <item.icon size={14} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mt-4 border-t border-black/[0.06] pt-4">
          <p className="px-3 mb-2 text-[10px] font-normal text-black truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-[10px] px-3 py-[9px] rounded-[2px] text-[11px] text-black/35 hover:text-black transition-colors w-full font-light"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-10">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
