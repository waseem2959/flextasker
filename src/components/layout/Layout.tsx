
import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollArea } from "@/components/ui/scroll-area";

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
