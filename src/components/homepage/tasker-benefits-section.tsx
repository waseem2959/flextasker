import { CheckCircle } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export const TaskerBenefitsSection: React.FC = () => {
  const commonStyles = {
    section: "py-12 bg-white sm:py-16 lg:py-20 xl:py-24",
    container: "px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl",
    grid: "grid grid-cols-1 lg:grid-cols-7 gap-x-20 gap-y-12",
    content: "lg:order-2 lg:col-span-4 max-w-lg lg:max-w-none",
    title: "text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl lg:pr-8",
    description: "mt-4 text-base font-normal leading-7 text-gray-600 lg:text-lg lg:mt-6 lg:pr-24 lg:leading-8",
    buttonContainer: "mt-8",
    button: "inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700",
    featuresGrid: "grid grid-cols-1 gap-8 pt-8 mt-8 border-t border-gray-200",
    featureItem: "flex items-center",
    featureIcon: "w-5 h-5 text-blue-600 mr-3 flex-shrink-0",
    featureText: "text-base font-normal text-gray-600",
    imageContainer: "grid p-6 bg-blue-100 lg:order-1 lg:col-span-3 rounded-3xl place-items-center",
    image: "w-full shadow-xl rounded-xl sm:max-w-xs"
  };

  const features = [
    "Free access to thousands of job opportunities",
    "No subscription or credit fees",
    "Earn extra income on a flexible schedule",
    "Grow your business and client base"
  ];

  return (
    <section className={commonStyles.section}>
      <div className={commonStyles.container}>
        <div className={commonStyles.grid}>
          {/* Image on the left side */}
          <div className={commonStyles.imageContainer}>
            <img
              className={commonStyles.image}
              src="/api/placeholder/400/300"
              alt="Be your own boss with FlexTasker"
              width="400"
              height="300"
            />
          </div>

          {/* Content on the right side */}
          <div className={commonStyles.content}>
            <h2 className={`${commonStyles.title} font-heading`}>
              Be your own boss
            </h2>
            <p className={`${commonStyles.description} font-body`}>
              Whether you're a genius spreadsheet guru or a diligent carpenter, find your next job on FlexTasker.
            </p>
            
            <div className={commonStyles.buttonContainer}>
              <Link to="/register">
                <button className={commonStyles.button} type="button">
                  Earn money as a Tasker
                </button>
              </Link>
            </div>

            <ul className={commonStyles.featuresGrid}>
              {features.map((feature) => (
                <li key={feature} className={commonStyles.featureItem}>
                  <CheckCircle className={commonStyles.featureIcon} />
                  <span className={commonStyles.featureText}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};