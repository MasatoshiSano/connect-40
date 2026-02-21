import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  hideFooter?: boolean;
}

export const Layout = ({ children, isAuthenticated = false, hideFooter = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-base-50 dark:bg-base">
      <Header isAuthenticated={isAuthenticated} />
      <main className="flex-1 flex flex-col">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};
