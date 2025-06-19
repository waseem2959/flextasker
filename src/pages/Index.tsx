
import { Testimonial14 } from '../components/homepage/featured-taskers';
import { HeroSection } from '../components/homepage/hero-section';
import { HowItWorksSection } from '../components/homepage/how-it-works-section';
import { TaskerBenefitsSection } from '../components/homepage/tasker-benefits-section';
import { TrustSafetyFeatures } from '../components/homepage/trust-safety-features';
import { VisualCategoryGrid } from '../components/homepage/visual-category-grid';
import { Layout } from '../components/layout/layout';
import { SEO } from '../utils/seo';

const Index = () => {
  return (
    <Layout>
      <SEO
        title="Flextasker | Find Skilled Task Doers & Hire Local Services"
        description="Find trusted local professionals for any task. From home repairs to digital services, connect with skilled taskers in your area. Post a task or offer your skills today!"
        canonicalUrl="https://flextasker.com"
        ogImage="https://flextasker.com/images/og-homepage.jpg"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Flextasker',
          url: 'https://flextasker.com',
          description: 'A marketplace connecting people who need tasks done with skilled local service providers',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://flextasker.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }}
      />
      {/* Hero Section */}
      <HeroSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Visual Category Grid */}
      <VisualCategoryGrid />

      <TrustSafetyFeatures />

      {/* Tasker Benefits Section */}
      <TaskerBenefitsSection />

      {/* Trust & Safety Features */}
      <Testimonial14 />
    </Layout>
  );
};

export default Index;
