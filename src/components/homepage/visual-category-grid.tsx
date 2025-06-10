import React from 'react';
import { Link } from 'react-router-dom';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  image: string;
}

const categoryData: CategoryItem[] = [
  {
    id: 'removalists',
    name: 'Removalists',
    description: 'Packing, wrapping, moving and more!',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=73&h=73&fit=crop'
  },
  {
    id: 'cleaning',
    name: 'Home cleaning',
    description: 'Clean, mop and tidy your house',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=73&h=73&fit=crop'
  },
  {
    id: 'assembly',
    name: 'Furniture assembly',
    description: 'Flatpack assembly and disassembly',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=73&h=73&fit=crop'
  },
  {
    id: 'delivery',
    name: 'Deliveries',
    description: 'Urgent deliveries and courier services',
    image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=73&h=73&fit=crop'
  },
  {
    id: 'gardening',
    name: 'Gardening & landscaping',
    description: 'Mulching, weeding and tidying up',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=73&h=73&fit=crop'
  },
  {
    id: 'painting',
    name: 'Painting',
    description: 'Interior and exterior wall painting',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=73&h=73&fit=crop'
  },
  {
    id: 'handyman',
    name: 'Handyperson',
    description: 'Help with home maintenance',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=73&h=73&fit=crop'
  },
  {
    id: 'business',
    name: 'Business & admin',
    description: 'Help with accounting and tax returns',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=73&h=73&fit=crop'
  },
  {
    id: 'design',
    name: 'Marketing & design',
    description: 'Help with website',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=73&h=73&fit=crop'
  },
  {
    id: 'other',
    name: 'Something else',
    description: 'Wall mount art and paintings',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=73&h=73&fit=crop'
  }
];

export const VisualCategoryGrid: React.FC = () => {
  // Create two rows for the infinite scroll effect
  const duplicatedCategories = [...categoryData, ...categoryData];

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 font-heading mb-4">
            Popular Categories
          </h2>
          <p className="text-xl text-neutral-700 font-body">
            Browse tasks by category to find what you need
          </p>
        </div>
      </div>
      <div className="relative">
        {/* First row - scrolling left */}
        <div className="flex animate-scroll-left mb-4">
          {duplicatedCategories.map((category, index) => (
            <Link
              key={`${category.id}-${index}`}
              to={`/tasks?category=${encodeURIComponent(category.name)}`}
              className="flex-shrink-0 mx-2 group"
            >
              <div className="w-72 bg-white border border-neutral-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-200 group-hover:scale-105 flex-shrink-0">
                <div className="flex items-start">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-16 h-16 rounded-xl object-cover mr-4 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors text-base mb-2 leading-tight">
                      {category.name}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Second row - scrolling right */}
        <div className="flex animate-scroll-right">
          {duplicatedCategories.map((category, index) => (
            <Link
              key={`${category.id}-reverse-${index}`}
              to={`/tasks?category=${encodeURIComponent(category.name)}`}
              className="flex-shrink-0 mx-2 group"
            >
              <div className="w-72 bg-white border border-neutral-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all duration-200 group-hover:scale-105 flex-shrink-0">
                <div className="flex items-start">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-16 h-16 rounded-xl object-cover mr-4 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors text-base mb-2 leading-tight">
                      {category.name}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
