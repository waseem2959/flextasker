
import React from 'react';
import { Footer } from './footer';
import { Navbar } from './navbar';
import MobileNavigation from '../enhanced/mobile-navigation';
import { SkipNavigation, MainContent } from '../ui/skip-navigation';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipNavigation />
      <Navbar />
      <MobileNavigation />
      <MainContent className="flex-grow">
        {children}
      </MainContent>
      {!hideFooter && <Footer />}
    </div>
  );
};
