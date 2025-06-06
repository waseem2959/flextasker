import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Search, Star, Users } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const categories = [
  'All Categories',
  'Cleaning & Maintenance',
  'Handyman Services',
  'Moving & Delivery',
  'Personal Assistant',
  'Tech Support',
  'Design & Creative',
  'Writing & Translation'
];

const stats = [
  { icon: Users, value: '50K+', label: 'Active Users' },
  { icon: CheckCircle, value: '100K+', label: 'Tasks Completed' },
  { icon: Star, value: '4.8', label: 'Average Rating' }
];

export const HeroSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleSearch = () => {
    // Handle search functionality
    console.log('Search:', { query: searchQuery, category: selectedCategory });
  };

  return (
    <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-600 rounded-full"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-primary-700 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-primary-500 rounded-full"></div>
        <div className="absolute bottom-40 right-1/3 w-8 h-8 bg-primary-600 rounded-full"></div>
      </div>

      <div className="relative container mx-auto px-4 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-text-primary leading-tight">
                Get things done with{' '}
                <span className="text-primary-600 relative">
                  trusted local experts
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-primary-700"
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
              
              <p className="text-xl text-text-secondary leading-relaxed max-w-lg">
                From home repairs to personal assistance, find skilled professionals 
                ready to help with any task. Post your task and get competitive bids.
              </p>
            </div>

            {/* Enhanced Search Widget with project-map styling */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-xl shadow-primary-900/5 border border-neutral-200 backdrop-blur-sm"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Enhanced search input with better visual hierarchy */}
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5 transition-colors group-focus-within:text-primary-600" />
                  <Input
                    type="text"
                    placeholder="What do you need help with?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl text-base font-body placeholder:text-neutral-500 transition-all duration-200"
                  />
                </div>

                {/* Enhanced category selector */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="md:w-52 h-14 border-2 border-neutral-200 focus:border-primary-500 rounded-xl font-body text-base">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-neutral-200 shadow-xl">
                    <SelectItem value="all" className="font-body">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="font-body">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Enhanced search button with project-map styling */}
                <Button
                  onClick={handleSearch}
                  className="h-14 px-8 bg-primary-900 hover:bg-primary-800 text-white font-heading font-semibold rounded-xl shadow-lg shadow-primary-900/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary-900/30 hover:-translate-y-0.5"
                >
                  Search Tasks
                </Button>
              </div>

              {/* Popular categories quick access */}
              <div className="mt-6 pt-4 border-t border-neutral-100">
                <p className="text-sm font-medium text-neutral-600 mb-3 font-body">Popular categories:</p>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 4).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-full transition-colors duration-200 font-body"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button asChild variant="primary" size="lg" className="group">
                <Link to="/post-task" className="flex items-center">
                  Post a Task
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-primary-600 hover:bg-primary-50">
                <Link to="/register">Earn Money as a Tasker</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-8 pt-4"
            >
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <stat.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
                    <div className="text-sm text-text-secondary">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative w-full max-w-lg mx-auto">
              {/* Main illustration placeholder */}
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl p-8 shadow-2xl">
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary-600 rounded-full mx-auto flex items-center justify-center">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-primary-100 rounded w-32 mx-auto"></div>
                      <div className="h-3 bg-primary-50 rounded w-24 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-success text-white p-3 rounded-xl shadow-lg"
              >
                <CheckCircle className="w-6 h-6" />
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-warning text-white p-3 rounded-xl shadow-lg"
              >
                <Star className="w-6 h-6" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
