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

export const TrustSafetyFeatures: React.FC = () => {
  return (
    <section className="py-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 font-heading mb-4">
            Trust and safety features for your protection
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {trustFeatures.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 font-heading mb-4">
                {feature.title}
              </h3>
              <p className="text-neutral-700 font-body leading-relaxed mb-4">
                {feature.description}
              </p>
              <Link 
                to={feature.linkUrl}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm underline transition-colors"
              >
                {feature.linkText}
              </Link>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Link to="/post-task">
            <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
              Post your task for free
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};
