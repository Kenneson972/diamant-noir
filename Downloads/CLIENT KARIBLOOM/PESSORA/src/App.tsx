import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/common/ScrollToTop';
import PageSEO from './components/common/PageSEO';
import LazyWidget from './components/common/LazyWidget';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import DemoAuthWrapper from './components/DemoAuthWrapper';
import MemberLayout from './components/member/MemberLayout';
import PageLoadingFallback from './components/common/PageLoadingFallback';

// Lazy load toutes les pages
const Home = lazy(() => import('./pages/Home'));
const Concept = lazy(() => import('./pages/Concept'));
const Menu = lazy(() => import('./pages/Menu'));
const NosProduits = lazy(() => import('./pages/NosProduits'));
const RangeDetail = lazy(() => import('./pages/RangeDetail'));
const DrinkDetail = lazy(() => import('./pages/DrinkDetail'));
const Evenements = lazy(() => import('./pages/Evenements'));
const Contact = lazy(() => import('./pages/Contact'));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'));
const CGV = lazy(() => import('./pages/CGV'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/member/Dashboard'));
const Subscription = lazy(() => import('./pages/member/Subscription'));
const Profile = lazy(() => import('./pages/member/Profile'));
const History = lazy(() => import('./pages/member/History'));
const MesEvenements = lazy(() => import('./pages/member/MesEvenements'));
const PessobotPage = lazy(() => import('./pages/PessobotPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers'));
const AdminEvenements = lazy(() => import('./pages/admin/AdminEvenements'));
const AdminProduits = lazy(() => import('./pages/admin/AdminProduits'));
const OraPlus = lazy(() => import('./pages/OraPlus'));
const EvenementDetail = lazy(() => import('./pages/EvenementDetail'));
const BilanBienEtre = lazy(() => import('./pages/BilanBienEtre'));
const LuxeMockup = lazy(() => import('./pages/LuxeMockup'));
const Chatbot = lazy(() => import('./components/common/Chatbot'));

// Layout wrapper pour gérer header/footer conditionnellement
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isMemberArea = location.pathname.startsWith('/mon-espace') || location.pathname.startsWith('/demo-espace');
  const isAuthPage = location.pathname === '/connexion' || location.pathname === '/inscription';
  const isLuxeMockup = location.pathname === '/mockup-luxe';
  const isAdminArea = location.pathname.startsWith('/admin');

  // Lazy loading auto pour images sans attributs
  useEffect(() => {
    const applyLazy = () => {
      document.querySelectorAll('img:not([loading])').forEach((img) => {
        (img as HTMLImageElement).setAttribute('loading', 'lazy');
        (img as HTMLImageElement).setAttribute('decoding', 'async');
      });
    };
    applyLazy();
    const t = setTimeout(applyLazy, 300);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <PageSEO />
      <div className="flex flex-col min-h-screen">
        {!isMemberArea && !isAuthPage && !isLuxeMockup && !isAdminArea && <Header />}
        <main className={isMemberArea || isAuthPage || isAdminArea ? 'flex-grow min-h-0 flex flex-col' : 'flex-grow'}>
          <Suspense fallback={<PageLoadingFallback />}>
            {children}
          </Suspense>
        </main>
        {!isMemberArea && !isAuthPage && !isLuxeMockup && !isAdminArea && <Footer />}
        {!isMemberArea && !isAuthPage && !isLuxeMockup && !isAdminArea && (
          <LazyWidget delay={1500} onIdle>
            <Chatbot />
          </LazyWidget>
        )}
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/concept" element={<Concept />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/nos-produits" element={<NosProduits />} />
            <Route path="/nos-produits/:rangeId" element={<RangeDetail />} />
            <Route path="/pessobot" element={<PessobotPage />} />
            <Route path="/ora-plus" element={<OraPlus />} />
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminOverview /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/membres" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminMembers /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/evenements" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminEvenements /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/produits" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminProduits /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/menu/:drinkId" element={<DrinkDetail />} />
            <Route path="/evenements" element={<Evenements />} />
            <Route path="/evenements/:slug" element={<EvenementDetail />} />
            <Route path="/bilan-bien-etre" element={<BilanBienEtre />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/cgv" element={<CGV />} />
            <Route path="/mockup-luxe" element={<LuxeMockup />} />

            {/* Auth Routes */}
            <Route path="/connexion" element={<Login />} />
            <Route path="/inscription" element={<Register />} />

            {/* DEMO Routes - Accès direct sans authentification */}
            <Route
              path="/demo-espace"
              element={
                <DemoAuthWrapper>
                  <MemberLayout>
                    <Dashboard />
                  </MemberLayout>
                </DemoAuthWrapper>
              }
            />
            <Route
              path="/demo-espace/evenements"
              element={
                <DemoAuthWrapper>
                  <MemberLayout>
                    <MesEvenements />
                  </MemberLayout>
                </DemoAuthWrapper>
              }
            />
            <Route
              path="/demo-espace/abonnement"
              element={
                <DemoAuthWrapper>
                  <MemberLayout>
                    <Subscription />
                  </MemberLayout>
                </DemoAuthWrapper>
              }
            />
            <Route
              path="/demo-espace/profil"
              element={
                <DemoAuthWrapper>
                  <MemberLayout>
                    <Profile />
                  </MemberLayout>
                </DemoAuthWrapper>
              }
            />
            <Route
              path="/demo-espace/historique"
              element={
                <DemoAuthWrapper>
                  <MemberLayout>
                    <History />
                  </MemberLayout>
                </DemoAuthWrapper>
              }
            />
            <Route
              path="/demo-espace/pessobot"
              element={
                <DemoAuthWrapper>
                  <MemberLayout>
                    <div className="h-full min-h-0 flex flex-col">
                      <Chatbot embedded />
                    </div>
                  </MemberLayout>
                </DemoAuthWrapper>
              }
            />

            {/* Protected Member Routes */}
            <Route
              path="/mon-espace"
              element={
                <ProtectedRoute>
                  <MemberLayout>
                    <Dashboard />
                  </MemberLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mon-espace/evenements"
              element={
                <ProtectedRoute>
                  <MemberLayout>
                    <MesEvenements />
                  </MemberLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mon-espace/abonnement"
              element={
                <ProtectedRoute>
                  <MemberLayout>
                    <Subscription />
                  </MemberLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mon-espace/profil"
              element={
                <ProtectedRoute>
                  <MemberLayout>
                    <Profile />
                  </MemberLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mon-espace/historique"
              element={
                <ProtectedRoute>
                  <MemberLayout>
                    <History />
                  </MemberLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mon-espace/pessobot"
              element={
                <ProtectedRoute>
                  <MemberLayout>
                    <div className="h-full min-h-0 flex flex-col">
                      <Chatbot embedded />
                    </div>
                  </MemberLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;
