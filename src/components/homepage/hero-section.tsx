import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Play, Star, Users } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

// Statistics data
const stats = [
  { icon: Users, value: '50K+', label: 'Active Users' },
  { icon: CheckCircle, value: '100K+', label: 'Tasks Completed' },
  { icon: Star, value: '4.8', label: 'Average Rating' }
];

// Common button styles - matching the first design's button styling
const commonButtonStyles =
  "inline-flex items-center justify-center px-4 py-2 text-base font-medium transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2";

export const HeroSection: React.FC = () => {
  return (
    <section className="pb-8 bg-white sm:pb-12 lg:pb-12">
      <div className="pt-8 overflow-hidden sm:pt-12 lg:relative lg:py-40">
        <div className="max-w-md px-4 mx-auto sm:max-w-3xl sm:px-6 lg:px-8 lg:max-w-7xl lg:grid lg:grid-cols-2 lg:gap-24">
          {/* Content Section - maintaining your animation and content */}
          <div className="lg:mt-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto text-center sm:max-w-lg lg:max-w-xl lg:text-left lg:mx-0"
            >
              {/* Main heading with your animated underline */}
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl xl:text-6xl sm:tracking-tight">
                Get things done with{' '}
                <span className="text-blue-600 relative">
                  trusted local experts
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-blue-600"
                    viewBox="0 0 300 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10C50 2 100 2 150 6C200 10 250 4 298 6"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Description paragraph */}
              <p className="mt-6 text-lg leading-7 text-gray-700 lg:leading-8 lg:text-xl">
                FlexTasker connects you with skilled professionals for any task.
                From home repairs to personal assistance, post your task and get competitive bids from trusted local experts.
              </p>
            </motion.div>

            {/* Action Buttons - styled to match first design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col items-stretch justify-center gap-4 mt-8 sm:flex-row sm:items-center sm:mt-10 lg:justify-start sm:flex-wrap"
            >
              {/* Primary CTA button */}
              <Link
                to="/post-task"
                className={`${commonButtonStyles} text-white bg-blue-600 border border-transparent shadow-sm hover:bg-blue-700 focus:ring-blue-700 group`}
              >
                Post a Task
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary button with play icon */}
              <Link
                to="/how-it-works"
                className={`${commonButtonStyles} text-gray-900 border border-gray-300 hover:bg-gray-100 focus:ring-gray-300`}
              >
                <Play className="w-4 h-4 mr-3 -ml-1 text-blue-600" />
                How it works
              </Link>
            </motion.div>

            {/* Stats Section - keeping your stats but styled to fit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-8 pt-8 justify-center lg:justify-start"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <stat.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Hero Image Section - matching first design's image treatment */}
        <div className="sm:mx-auto sm:max-w-3xl sm:px-6">
          <div className="py-12 mt-6 sm:relative sm:mt-12 sm:py-16 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <div className="relative pl-10 -mr-40 sm:max-w-3xl lg:max-w-none lg:h-full lg:pl-24">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative"
              >
                {/* Main Image Container - styled like the first design */}
                <div className="w-full shadow-2xl rounded-xl lg:rounded-2xl ring-[24px] lg:ring-[48px] ring-blue-100 lg:h-full lg:w-auto lg:max-w-none">
                  {/* Placeholder for dashboard/app image */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl lg:rounded-2xl flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
                    <div className="text-center space-y-6 p-8 bg-white rounded-xl shadow-lg max-w-sm mx-auto">
                      {/* Icon container */}
                      <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center">
                        <Users className="w-12 h-12 text-white" />
                      </div>
                      {/* Content placeholders */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">Find Your Expert</h3>
                        <p className="text-gray-600">Connect with verified professionals in your area</p>
                        <div className="flex justify-center space-x-2 pt-4">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                          <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Success Badge - maintaining your animations */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-xl shadow-lg"
                >
                  <CheckCircle className="w-6 h-6" />
                </motion.div>

                {/* Floating Rating Badge - maintaining your animations */}
                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-4 -left-4 bg-blue-500 text-white p-3 rounded-xl shadow-lg"
                >
                  <Star className="w-6 h-6" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};