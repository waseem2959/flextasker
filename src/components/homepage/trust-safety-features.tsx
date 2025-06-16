import { CreditCard, Shield, Star } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface TrustFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
}

const trustFeatures: TrustFeature[] = [
  {
    icon: CreditCard,
    title: 'Secure payments',
    description: 'Only release payment when the task is completed to your satisfaction',
    linkText: 'read more',
    linkUrl: '/payment-security'
  },
  {
    icon: Star,
    title: 'Trusted ratings and reviews',
    description: 'Pick the right person for the task based on real ratings and reviews from other users',
    linkText: 'read more',
    linkUrl: '/reviews-system'
  },
  {
    icon: Shield,
    title: 'Insurance for peace of mind',
    description: 'We provide liability insurance for Taskers performing most task activities',
    linkText: 'read more',
    linkUrl: '/insurance'
  }
];

const commonStyles = {
  section: "py-12 bg-gray-50 sm:py-16 lg:py-20 xl:py-24",
  container: "px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl",
  heading: "text-3xl font-normal text-gray-900 sm:text-4xl lg:text-5xl xl:text-6xl",
  subHeading: "mt-8 text-xl font-normal text-gray-900",
  paragraph: "mt-8 text-lg font-normal text-gray-600",
  gradientText: "bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-500",
  button: "inline-flex items-center px-8 py-4 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200",
  buttonText: "text-white",
};

export const TrustSafetyFeatures: React.FC = () => {
  return (
    <section className={commonStyles.section}>
      <div className={commonStyles.container}>
        <div className="text-center mb-16">
          <h2 className={`${commonStyles.heading} font-heading`}>
            Trust and safety features for your{' '}
            <span className={commonStyles.gradientText}>protection</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {trustFeatures.map((feature) => (
            <div key={feature.title} className="text-center p-6 rounded-lg bg-white shadow-lg hover:shadow-xl border border-gray-200 hover:border-cyan-500/50 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-cyan-500/20">
                <feature.icon className="w-10 h-10 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-heading mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 font-body leading-relaxed mb-6">
                {feature.description}
              </p>
              <Link
                to={feature.linkUrl}
                className={`${commonStyles.gradientText} hover:opacity-80 font-medium text-sm underline transition-opacity`}
              >
                {feature.linkText}
              </Link>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Link to="/post-task">
            <button className={commonStyles.button}>
              <span className={commonStyles.buttonText}>Post your task for free</span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};