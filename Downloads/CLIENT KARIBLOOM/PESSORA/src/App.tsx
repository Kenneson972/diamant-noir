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
const AdminMemberDetail = lazy(() => import('./pages/admin/AdminMemberDetail'));
const AdminEvenements = lazy(() => import('./pages/admin/AdminEvenements'));
const AdminProduits = lazy(() => import('./pages/admin/AdminProduits'));
const AdminBilans = lazy(() => import('./pages/admin/AdminBilans'));
const AdminCommunications = lazy(() => import('./pages/admin/AdminCommunications'));
const OraPlus = lazy(() => import('./pages/OraPlus'));
const EvenementDetail = lazy(() => import('./pages/EvenementDetail'));
const BilanBienEtre = lazy(() => import('./pages/BilanBienEtre'));
const LuxeMockup = lazy(() => import('./pages/LuxeMockup'));
const ManagerSketchMockup = lazy(() => import('./pages/ManagerSketchMockup'));
const Chatbot = lazy(() => import('./components/common/Chatbot'));

// Layout wrapper pour gérer header/footer conditionnellement
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isMemberArea = location.pathname.startsWith('/mon-espace') || location.pathname.startsWith('/demo-espace');
  const isAuthPage = location.pathname === '/connexion' || location.pathname === '/inscription';
  const isInternalMockup =
    location.pathname === '/mockup-luxe' || location.pathname === '/mockup-croquis-gerant';
  const isAdminArea = location.pathname.startsWith('/admin');

  // Lazy loading pour les <img> rendus après coup (React) — 2 passes légères
  useEffect(() => {
    const applyLazy = () => {
      document.querySelectorAll('img:not([loading])').forEach((img) => {
        (img as HTMLImageElement).setAttribute('loading', 'lazy');
        (img as HTMLImageElement).setAttribute('decoding', 'async');
      });
    };
    applyLazy();
    const id = requestAnimationFrame(() => applyLazy());
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  const showPublicChrome = !isMemberArea && !isAuthPage && !isInternalMockup && !isAdminArea;

  return (
    <>
      <ScrollToTop />
      <PageSEO />
      <div className="flex min-h-screen flex-col">
        {showPublicChrome && (
          <a
            href="#main-content"
            className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-3 focus:text-[11px] focus:font-normal focus:uppercase focus:tracking-[0.14em] focus:text-black focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-black/20"
          >
            Aller au contenu
          </a>
        )}
        {showPublicChrome && <Header />}
        <main
          id="main-content"
          tabIndex={-1}
          className={isMemberArea || isAuthPage || isAdminArea ? 'flex min-h-0 flex-grow flex-col outline-none' : 'flex-grow outline-none'}
        >
          <Suspense fallback={<PageLoadingFallback />}>
            {children}
          </Suspense>
        </main>
        {showPublicChrome && <Footer />}
        {showPublicChrome && (
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
            <Route path="/admin/membres/:memberId" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminMemberDetail /></AdminLayout>
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
            <Route path="/admin/bilans" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminBilans /></AdminLayout>
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/communication" element={
              <ProtectedAdminRoute>
                <AdminLayout><AdminCommunications /></AdminLayout>
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
            <Route path="/mockup-croquis-gerant" element={<ManagerSketchMockup />} />

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
