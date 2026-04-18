import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu as MenuIcon, X, User, LogIn, ChevronDown, ArrowRight, Sparkles, Zap, Droplet } from 'lucide-react';
import { Button, buttonVariants, cn } from '@heroui/react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { wellnessItems, energieItems, shakesItems, coffeeItems } from '../../data/menuData';

type DropdownType = 'menu' | 'products' | null;

const tickerMessages = [
  'Le 1er Bar Protéiné & Bien-Être de Martinique',
  'Shakes 100% vegan — 25 vitamines & minéraux',
  '6 boosters au choix pour +1€',
  'Découvrez Óra+ — gammes Wellness, Sport & Skin',
];

const navFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EDE7DF] rounded-sm';

const Header = () => {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { label: string; path: string; hasDropdown?: boolean; dropdownType?: DropdownType }[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Le Concept', path: '/concept' },
    { label: 'Nos Produits', path: '/nos-produits', hasDropdown: true, dropdownType: 'products' },
    { label: 'Menu', path: '/menu', hasDropdown: true, dropdownType: 'menu' },
    { label: 'Óra+', path: '/ora-plus' },
    { label: 'Événements', path: '/evenements' },
    { label: 'Bilan Bien-être', path: '/bilan-bien-etre' },
    { label: 'Contact', path: '/contact' }
  ];

  const menuPreview = [
    { category: 'wellness', label: 'Wellness', items: wellnessItems.slice(0, 1) },
    { category: 'energie', label: 'Énergie', items: energieItems.slice(0, 1) },
    { category: 'shakes', label: 'Shakes', items: shakesItems.slice(0, 1) },
    { category: 'coffee', label: 'Coffee', items: coffeeItems.slice(0, 1) }
  ];

  const productsRanges = [
    { label: 'Wellness', path: 'wellness', icon: Sparkles, color: 'text-emerald-800', bg: 'bg-[#E5EBE4]' },
    { label: 'Sport', path: 'sport', icon: Zap, color: 'text-orange-800', bg: 'bg-[#EBE8E2]' },
    { label: 'Skin', path: 'skin', icon: Droplet, color: 'text-rose-800', bg: 'bg-[#EBE6E8]' }
  ];

  const handleMouseEnter = (type: DropdownType) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(type);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  const closeDropdown = () => setActiveDropdown(null);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Ticker Bar */}
      <div className="bg-primary-forest text-white text-center py-2 text-[11px] font-medium tracking-wider overflow-hidden h-9">
        <AnimatePresence mode="wait">
          <motion.p
            key={tickerIndex}
            initial={reduceMotion ? false : { y: 16, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: -16, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeInOut' }}
          >
            {tickerMessages[tickerIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Main Nav */}
      <div className="border-b border-black/[0.06] bg-[#EDE7DF]/80 backdrop-blur-2xl backdrop-saturate-150">
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className={cn('group flex items-center rounded-sm', navFocus)}>
              <img src="/logo-o.png" alt="PessÓra" width={88} height={44} loading="eager" decoding="async" className="h-11 w-auto object-contain transition-opacity duration-300 group-hover:opacity-90" />
            </Link>

            <nav className="hidden md:flex items-center gap-8 lg:gap-10">
              {navItems.map((item) => (
                <div
                  key={item.path}
                  onMouseEnter={item.hasDropdown && item.dropdownType ? () => handleMouseEnter(item.dropdownType!) : undefined}
                  onMouseLeave={item.hasDropdown ? handleMouseLeave : undefined}
                  className="relative h-20 flex items-center"
                >
                  <Link
                    to={item.path}
                    className={cn(
                      navFocus,
                      'flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-200 hover:text-primary-forest',
                      isActive(item.path) ? 'text-primary' : 'text-primary/45'
                    )}
                  >
                    {item.label}
                    {item.hasDropdown && (
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-300 ${activeDropdown === item.dropdownType ? 'rotate-180' : ''}`}
                      />
                    )}
                  </Link>
                </div>
              ))}

              <div className="h-4 w-[1px] bg-primary/10 mx-2"></div>

              {isAuthenticated ? (
                <Link
                  to="/mon-espace"
                  className={cn(navFocus, 'rounded-full p-1.5 text-primary transition-colors hover:text-primary-forest')}
                  aria-label="Mon espace"
                >
                  <User size={18} strokeWidth={1.5} />
                </Link>
              ) : (
                <div className="flex items-center gap-6">
                  <Link
                    to="/connexion"
                    className={cn(navFocus, 'rounded-full p-1.5 text-primary transition-colors hover:text-primary-forest')}
                    aria-label="Connexion"
                  >
                    <LogIn size={18} strokeWidth={1.5} />
                  </Link>
                  <Link
                    to="/inscription"
                    className={cn(
                      buttonVariants({ variant: 'primary', size: 'sm' }),
                      navFocus,
                      'hidden rounded-full bg-primary px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-primary-forest lg:inline-flex'
                    )}
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </nav>

            <Button
              type="button"
              variant="ghost"
              isIconOnly
              className="md:hidden text-primary"
              aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              onPress={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} strokeWidth={1.5} /> : <MenuIcon size={24} strokeWidth={1.5} />}
            </Button>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeDropdown && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
              onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
              onMouseLeave={handleMouseLeave}
              className="absolute top-full left-0 right-0 bg-[#EDE7DF] border-b border-primary/5 shadow-2xl overflow-hidden hidden md:block z-40"
            >
              <div className="container-custom py-12">
                <div className="grid grid-cols-12 gap-12">
                  {activeDropdown === 'menu' ? (
                    <>
                      <div className="col-span-3 border-r border-primary/5 pr-12 flex flex-col justify-center">
                        <h3 className="text-4xl font-serif text-primary mb-6 leading-tight">La Carte</h3>
                        <p className="text-sm text-primary/60 font-light mb-8 leading-relaxed">Boissons protéinées, cafés et boosters bien-être.</p>
                        <Link
                          to="/menu"
                          onClick={closeDropdown}
                          className={cn(
                            buttonVariants({ variant: 'primary', size: 'md' }),
                            navFocus,
                            'inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-primary-forest'
                          )}
                        >
                          Voir la carte <ArrowRight size={14} />
                        </Link>
                      </div>
                      <div className="col-span-9">
                        <div className="grid grid-cols-4 gap-8">
                          {menuPreview.map((cat) => (
                            <Link
                              key={cat.category}
                              to={`/menu?category=${cat.category}`}
                              onClick={closeDropdown}
                              className={cn(navFocus, 'group flex flex-col rounded-xl')}
                            >
                              <div className="aspect-[4/5] bg-accent-cream-light rounded-3xl mb-4 flex items-center justify-center text-7xl group-hover:shadow-xl transition-all duration-500">
                                {cat.items[0]?.icon || '🥤'}
                              </div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">{cat.label}</h4>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-3 border-r border-primary/5 pr-12 flex flex-col justify-center">
                        <h3 className="text-4xl font-serif text-primary mb-6 leading-tight">Nos Produits</h3>
                        <p className="text-sm text-primary/60 font-light mb-8 leading-relaxed">Gammes Wellness, Sport et Skin pour votre quotidien.</p>
                        <Link
                          to="/nos-produits"
                          onClick={closeDropdown}
                          className={cn(
                            buttonVariants({ variant: 'primary', size: 'md' }),
                            navFocus,
                            'inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-primary-forest'
                          )}
                        >
                          Tout explorer <ArrowRight size={14} />
                        </Link>
                      </div>
                      <div className="col-span-9">
                        <div className="grid grid-cols-3 gap-8">
                          {productsRanges.map((range) => (
                            <Link
                              key={range.path}
                              to={`/nos-produits/${range.path}`}
                              onClick={closeDropdown}
                              className={cn(navFocus, 'group flex flex-col rounded-xl')}
                            >
                              <div className={`aspect-[4/5] ${range.bg} rounded-3xl mb-4 flex items-center justify-center group-hover:shadow-xl transition-all duration-500`}>
                                <range.icon size={64} className={`${range.color} opacity-40 group-hover:opacity-100 transition-opacity`} strokeWidth={1} />
                              </div>
                              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">{range.label}</h4>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.nav
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              className="md:hidden space-y-6 overflow-hidden border-t border-primary/5 bg-[#EDE7DF] p-6"
            >
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    navFocus,
                    'block rounded-sm py-1 text-[11px] font-semibold uppercase tracking-[0.22em]',
                    isActive(item.path) ? 'text-primary' : 'text-primary/45'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/inscription"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    navFocus,
                    'block border-t border-primary/5 pt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-forest'
                  )}
                >
                  Créer un compte
                </Link>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
