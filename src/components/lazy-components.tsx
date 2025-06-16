/**
 * Lazy Components
 * 
 * Code-split components using React.lazy for optimal bundle size and loading performance.
 * Components are grouped by feature and loading priority.
 */

import { lazy, Suspense } from 'react';
import { Spinner } from './ui/loading-states';

// === LOADING WRAPPER ===
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LazyWrapper = ({ children, fallback }: LazyWrapperProps) => (
  <Suspense fallback={fallback || <Spinner size="lg" />}>
    {children}
  </Suspense>
);

// === PAGE COMPONENTS (High Priority - Load First) ===
export const LazyIndex = lazy(() => import('../pages/Index'));
export const LazyLogin = lazy(() => import('../pages/login'));
export const LazyRegister = lazy(() => import('../pages/register'));
export const LazyTasks = lazy(() => import('../pages/tasks'));

// === DASHBOARD COMPONENTS (Medium Priority) ===
export const LazyDashboard = lazy(() => import('../pages/dashboard'));
export const LazyProfile = lazy(() => import('../pages/profile'));
export const LazySettings = lazy(() => import('../pages/settings'));

// === TASK MANAGEMENT (Medium Priority) ===
export const LazyTaskDetail = lazy(() => import('../pages/task-detail'));
export const LazyTaskCreateWizard = lazy(() => import('../pages/task-create-wizard'));

// === MESSAGING & CHAT (Low Priority) ===
export const LazyChatInterface = lazy(() =>
  import('../components/chat/chat-interface')
);
export const LazyNotifications = lazy(() => import('../pages/notifications'));

// === UTILITY PAGES (Low Priority) ===
export const LazyAboutUs = lazy(() => import('../pages/about-us'));
export const LazyContact = lazy(() => import('../pages/contact'));
export const LazyFAQ = lazy(() => import('../pages/faq'));
export const LazyHowItWorks = lazy(() => import('../pages/how-it-works'));
export const LazyPricing = lazy(() => import('../pages/pricing'));

// === ERROR PAGES (Load on Demand) ===
export const LazyNotFound = lazy(() => import('../pages/not-found'));

// === SPECIALIZED COMPONENTS ===
export const LazySearchResults = lazy(() => import('../pages/search-results'));
export const LazyProfilePublic = lazy(() => import('../pages/profile-public'));

// === WRAPPER COMPONENTS WITH CUSTOM LOADING ===
export const IndexPage = () => (
  <LazyWrapper fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
    <LazyIndex />
  </LazyWrapper>
);

export const LoginPage = () => (
  <LazyWrapper fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
    <LazyLogin />
  </LazyWrapper>
);

export const RegisterPage = () => (
  <LazyWrapper fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
    <LazyRegister />
  </LazyWrapper>
);

export const TasksPage = () => (
  <LazyWrapper>
    <LazyTasks />
  </LazyWrapper>
);

export const DashboardPage = () => (
  <LazyWrapper>
    <LazyDashboard />
  </LazyWrapper>
);

export const ProfilePage = () => (
  <LazyWrapper>
    <LazyProfile />
  </LazyWrapper>
);

export const TaskDetailPage = () => (
  <LazyWrapper>
    <LazyTaskDetail />
  </LazyWrapper>
);

export const TaskCreateWizardPage = () => (
  <LazyWrapper>
    <LazyTaskCreateWizard />
  </LazyWrapper>
);

export const NotFoundPage = () => (
  <LazyWrapper>
    <LazyNotFound />
  </LazyWrapper>
);



// === UTILITY PAGES ===
export const AboutUsPage = () => (
  <LazyWrapper>
    <LazyAboutUs />
  </LazyWrapper>
);

export const ContactPage = () => (
  <LazyWrapper>
    <LazyContact />
  </LazyWrapper>
);

export const FAQPage = () => (
  <LazyWrapper>
    <LazyFAQ />
  </LazyWrapper>
);

export const HowItWorksPage = () => (
  <LazyWrapper>
    <LazyHowItWorks />
  </LazyWrapper>
);

export const PricingPage = () => (
  <LazyWrapper>
    <LazyPricing />
  </LazyWrapper>
);

export const NotificationsPage = () => (
  <LazyWrapper>
    <LazyNotifications />
  </LazyWrapper>
);

export const SettingsPage = () => (
  <LazyWrapper>
    <LazySettings />
  </LazyWrapper>
);

export const SearchResultsPage = () => (
  <LazyWrapper>
    <LazySearchResults />
  </LazyWrapper>
);

export const ProfilePublicPage = () => (
  <LazyWrapper>
    <LazyProfilePublic />
  </LazyWrapper>
);

// === COMPONENT LAZY LOADING ===
export const ChatInterfaceComponent = () => (
  <LazyWrapper fallback={<div className="p-4"><Spinner /></div>}>
    <LazyChatInterface />
  </LazyWrapper>
);


