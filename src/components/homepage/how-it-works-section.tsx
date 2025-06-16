import { CheckCircle } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

// Define the three steps of the process with unique IDs for proper React keys
const processSteps = [
  {
    id: "describe-task",
    number: "1",
    title: "Describe what you need done",
    description: "Tell us about your task and we'll match you with skilled professionals who can help"
  },
  {
    id: "set-budget",
    number: "2", 
    title: "Set your budget",
    description: "Choose a fair price for your task and receive competitive offers from talented Taskers"
  },
  {
    id: "choose-tasker",
    number: "3",
    title: "Receive quotes and pick the best Tasker",
    description: "Review profiles, ratings, and offers to choose the perfect professional for your needs"
  }
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-12 bg-gray-50 sm:py-16 lg:py-20">
      <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-2 lg:gap-x-16 lg:items-center">
          {/* Content Section */}
          <div className="lg:pr-8">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              Get things done in 3 simple steps
            </h2>
            {/* Process Steps */}
            <div className="mt-10 space-y-8">
              {processSteps.map((step) => (
                <div key={step.id} className="flex items-start">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full flex-shrink-0">
                    <span className="text-lg font-semibold">{step.number}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="mt-10">
              <Link
                to="/post-task"
                className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Post your first task
                <CheckCircle className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative lg:pl-8">
            <img
              className="w-full rounded-lg shadow-xl"
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
              alt="Professional completing tasks"
            />
          </div>
        </div>
      </div>
    </section>
  );
};