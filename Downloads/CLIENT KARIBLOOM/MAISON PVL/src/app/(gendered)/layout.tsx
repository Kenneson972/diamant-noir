'use client';

import { usePathname } from 'next/navigation';
import { GenderedLayout } from '@/components/layout/GenderedLayout';

export default function GenderedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const gender = pathname.startsWith('/femme') ? 'femme' : 'homme';

  return <GenderedLayout gender={gender}>{children}</GenderedLayout>;
}
