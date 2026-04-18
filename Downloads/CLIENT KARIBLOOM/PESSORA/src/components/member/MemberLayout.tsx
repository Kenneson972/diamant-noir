import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  History,
  LogOut,
  Menu,
  X,
  Settings,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDemo = location.pathname.startsWith('/demo-espace');
  const basePath = isDemo ? '/demo-espace' : '/mon-espace';

  const activeColor = 'text-[#D9F99D]';

  const menuItems = [
    { label: 'Home', icon: LayoutDashboard, path: basePath },
    { label: 'Pessobot', icon: MessageCircle, path: `${basePath}/pessobot` },
    { label: 'Abonnement', icon: CreditCard, path: `${basePath}/abonnement` },
    { label: 'Historique', icon: History, path: `${basePath}/historique` },
  ];

  const bottomItems = [
    { label: 'Sécurité', icon: Shield, path: '#' },
    { label: 'Settings', icon: Settings, path: `${basePath}/profil` },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed inset-0 flex w-full overflow-hidden bg-[#EDE7DF] font-sans selection:bg-primary/20">
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black p-6 text-white md:hidden">
        <span className="text-xl font-bold text-[#D9F99D]">PessÓra</span>
        <Button
          type="button"
          variant="ghost"
          isIconOnly
          className="text-white"
          aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-black py-12 pl-8 text-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-16">
          <h1 className={`text-3xl font-bold tracking-tight ${activeColor}`}>PessÓra</h1>
        </div>

        <nav className="flex-1 space-y-8">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`group flex items-center gap-4 transition-colors duration-200 ${
                isActive(item.path) ? activeColor : 'text-white hover:text-[#D9F99D]'
              }`}
            >
              <item.icon
                size={22}
                strokeWidth={isActive(item.path) ? 2.5 : 2}
                className={isActive(item.path) ? 'fill-current opacity-20' : ''}
              />
              <span className={`text-sm font-medium ${isActive(item.path) ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-8">
          <div className="space-y-8 pt-8">
            {bottomItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-4 transition-colors duration-200 ${
                  isActive(item.path) ? activeColor : 'text-white hover:text-[#D9F99D]'
                }`}
              >
                {item.label === 'Sécurité' ? (
                  <span className="text-sm font-medium">Security</span>
                ) : (
                  <>
                    <item.icon size={22} strokeWidth={2} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </>
                )}
              </Link>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            onPress={handleLogout}
            className="flex w-full items-center justify-start gap-4 pt-4 text-white hover:text-red-400"
          >
            <LogOut size={22} strokeWidth={2} />
            <span className="text-sm font-medium">Logout</span>
          </Button>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-l-[3rem] bg-[#F5F0E8] p-6 shadow-2xl md:my-4 md:mr-4 md:p-10 lg:p-12">
        <div className="mx-auto flex min-h-full max-w-[1600px] flex-col">{children}</div>
      </main>
    </div>
  );
};

export default MemberLayout;
