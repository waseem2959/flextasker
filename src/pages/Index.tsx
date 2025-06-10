import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FeaturedTaskers } from '../components/homepage/featured-taskers';
import { CategoryTabs, LiveTaskExamples } from '../components/homepage/live-task-examples';
import { TrustSafetyFeatures } from '../components/homepage/trust-safety-features';
import { VisualCategoryGrid } from '../components/homepage/visual-category-grid';
import { Layout } from '../components/layout/Layout';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState('delivery');

  return (
    <Layout>
      {/* Airtasker-style Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 bg-primary-600 rounded-full"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-primary-700 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-primary-500 rounded-full"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-heading text-neutral-900 leading-tight mb-8">
              Post any task. Pick the best person. Get it done.
            </h1>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
              <Button asChild size="lg" className="bg-primary-600 hover:bg-primary-700 text-white font-heading font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 min-w-[200px]">
                <Link to="/post-task">Post your task for free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-heading font-semibold px-8 py-4 rounded-xl transition-all duration-200 min-w-[200px]">
                <Link to="/register">Earn money as a Tasker</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-center">
              <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-sm">
                <Users className="w-6 h-6 text-primary-600" />
                <span className="text-lg font-semibold text-neutral-900">50K+ customers</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-sm">
                <CheckCircle className="w-6 h-6 text-primary-600" />
                <span className="text-lg font-semibold text-neutral-900">100K+ tasks done</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-full shadow-sm">
                <Star className="w-6 h-6 text-primary-600" />
                <span className="text-lg font-semibold text-neutral-900">4.8 average rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 font-heading mb-4">
              Post your first task in seconds
            </h2>
            <p className="text-xl text-neutral-700 font-body">
              Save yourself hours and get your to-do list completed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-neutral-900 font-heading mb-4">
                Describe what you need done
              </h3>
              <p className="text-neutral-600 font-body">
                Tell us about your task and we'll match you with skilled professionals
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-neutral-900 font-heading mb-4">
                Set your budget
              </h3>
              <p className="text-neutral-600 font-body">
                Choose a fair price for your task and receive competitive offers
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-20 h-20 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-neutral-900 font-heading mb-4">
                Receive quotes and pick the best Tasker
              </h3>
              <p className="text-neutral-600 font-body">
                Review profiles, ratings, and offers to choose the perfect Tasker
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link to="/post-task">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white font-heading font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                Post your task
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Visual Category Grid */}
      <VisualCategoryGrid />

      {/* Live Task Examples Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 font-heading mb-4">
              See what others are getting done
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <CategoryTabs
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
            <div className="space-y-6">
              <LiveTaskExamples category={activeCategory as any} />
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Features */}
      <TrustSafetyFeatures />

      {/* Be Your Own Boss Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-neutral-900 font-heading mb-6">
                Be your own boss
              </h2>
              <p className="text-xl text-neutral-700 font-body mb-8">
                Whether you're a genius spreadsheet guru or a diligent carpenter, find your next job on FlexTasker.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-neutral-700">Free access to thousands of job opportunities</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-neutral-700">No subscription or credit fees</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-neutral-700">Earn extra income on a flexible schedule</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-neutral-700">Grow your business and client base</span>
                </li>
              </ul>
              <Link to="/register">
                <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white font-heading font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                  Earn money as a Tasker
                </Button>
              </Link>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-primary-600 mb-2">50,000</div>
              <p className="text-xl text-neutral-700 font-body mb-4">Taskers have earned an income on FlexTasker</p>
              <p className="text-neutral-600">Start earning with Australia's trusted local services marketplace.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Taskers Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 font-heading">
              50,000 Taskers have earned an income on FlexTasker
            </h2>
            <p className="mt-4 text-xl text-neutral-600 font-body">
              Start earning with Australia's trusted local services marketplace.
            </p>
          </div>

          <FeaturedTaskers />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold font-heading mb-6">Ready to get started?</h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            Join FlexTasker today and connect with skilled workers or find work opportunities near you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/post-task">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-neutral-100 font-heading font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 min-w-[200px]">
                Post a Task
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-heading font-semibold px-8 py-4 rounded-xl transition-all duration-200 min-w-[200px]">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
