import { ReactNode } from 'react';
import { Layout } from '../components/layout/Layout';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * MainLayout component that wraps page content with the standard layout
 * This component ensures consistent page structure across the application
 */
const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Layout>
      {children}
    </Layout>
  );
};

export default MainLayout;
