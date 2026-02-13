import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  isAuthenticated?: boolean;
}

export const Layout = ({ children, isAuthenticated = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark">
      <Header isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
