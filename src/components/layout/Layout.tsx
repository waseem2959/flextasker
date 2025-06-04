
import React from 'react';
import { ScrollArea } from "../ui/scroll-area";
import { Footer } from './Footer';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideFooter = false }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ScrollArea className="flex-grow">
        <main className="flex-grow">
          {children}
        </main>
      </ScrollArea>
      {!hideFooter && <Footer />}
    </div>
  );
};
