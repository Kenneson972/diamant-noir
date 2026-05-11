'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { AuthProvider } from './AuthContext';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';
import '@/i18n/config';

function I18nInit({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nInit>
      <AuthProvider>
        <AppShell>{children}</AppShell>
      </AuthProvider>
    </I18nInit>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isEntry = pathname === '/';
  const isCheckout = pathname.startsWith('/checkout');
  const isAuth =
    pathname.startsWith('/connexion') || pathname.startsWith('/inscription');

  return (
    <>
      <ScrollToTop />
      <div className={`flex min-h-screen flex-col${isEntry ? '' : ''}`}>
        {!isCheckout && !isAuth && !isEntry && <Header />}
        <main
          id="main-content"
          className={
            isCheckout || isAuth || isEntry
              ? 'flex flex-1 flex-col'
              : 'flex-1'
          }
        >
          {children}
        </main>
        {!isCheckout && !isAuth && !isEntry && <Footer />}
      </div>
    </>
  );
}
