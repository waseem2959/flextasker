/**
 * Lazy Components
 * 
 * Code-split components using React.lazy for optimal bundle size and loading performance.
 * Components are grouped by feature and loading priority.
 */

import { Suspense } from 'react';
import { Spinner } from './ui/loading-states';
import { lazyWithRetry } from '../utils/lazy-loading';

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
export const LazyIndex = lazyWithRetry(() => import('../pages/Index'), { retries: 3 });
export const LazyLogin = lazyWithRetry(() => import('../pages/Login'), { retries: 3 });
export const LazyRegister = lazyWithRetry(() => import('../pages/Register'), { retries: 3 });
export const LazyTasks = lazyWithRetry(() => import('../pages/Tasks'), { retries: 2 });

// === DASHBOARD COMPONENTS (Medium Priority) ===
export const LazyDashboard = lazyWithRetry(() => import('../pages/Dashboard'), { retries: 2 });
export const LazyProfile = lazyWithRetry(() => import('../pages/Profile'), { retries: 2 });
export const LazySettings = lazyWithRetry(() => import('../pages/settings'), { retries: 1 });

// === TASK MANAGEMENT (Medium Priority) ===
export const LazyTaskDetail = lazyWithRetry(() => import('../pages/task-detail'), { retries: 2 });
export const LazyTaskCreateWizard = lazyWithRetry(() => import('../pages/task-create-wizard'), { retries: 2 });

// === MESSAGING & CHAT (Low Priority) ===
export const LazyChatInterface = lazyWithRetry(() =>
  import('../components/chat/chat-interface'), { retries: 1 }
);
export const LazyNotifications = lazyWithRetry(() => import('../pages/notifications'), { retries: 1 });

// === UTILITY PAGES (Low Priority) ===
export const LazyAboutUs = lazyWithRetry(() => import('../pages/about-us'), { retries: 1 });
export const LazyContact = lazyWithRetry(() => import('../pages/contact'), { retries: 1 });
export const LazyFAQ = lazyWithRetry(() => import('../pages/faq'), { retries: 1 });
export const LazyHowItWorks = lazyWithRetry(() => import('../pages/how-it-works'), { retries: 1 });
export const LazyPricing = lazyWithRetry(() => import('../pages/pricing'), { retries: 1 });

// === ERROR PAGES (Load on Demand) ===
export const LazyNotFound = lazyWithRetry(() => import('../pages/not-found'), { retries: 1 });

// === SPECIALIZED COMPONENTS ===
export const LazySearchResults = lazyWithRetry(() => import('../pages/search-results'), { retries: 1 });
export const LazyProfilePublic = lazyWithRetry(() => import('../pages/profile-public'), { retries: 1 });

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


