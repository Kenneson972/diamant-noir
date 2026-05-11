import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface GenderedLayoutProps {
  gender: 'homme' | 'femme';
  children: React.ReactNode;
}

export function GenderedLayout({ children }: GenderedLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-pvl-white">
      <Header variant="transparent" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
