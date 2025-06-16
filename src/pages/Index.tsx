
import { Testimonial14 } from '../components/homepage/featured-taskers';
import { HeroSection } from '../components/homepage/hero-section';
import { HowItWorksSection } from '../components/homepage/how-it-works-section';
import { TaskerBenefitsSection } from '../components/homepage/tasker-benefits-section';
import { TrustSafetyFeatures } from '../components/homepage/trust-safety-features';
import { VisualCategoryGrid } from '../components/homepage/visual-category-grid';
import { Layout } from '../components/layout/Layout';

const Index = () => {

  return (
    <Layout>
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
