import { ReactNode, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DemoAuthWrapperProps {
  children: ReactNode;
}

const DemoAuthWrapper = ({ children }: DemoAuthWrapperProps) => {
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) return;
    login('demo@pessora.mq', 'demo123').catch((err) => {
      if (import.meta.env.DEV) console.error('[DemoAuthWrapper] demo login failed:', err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
};

export default DemoAuthWrapper;
