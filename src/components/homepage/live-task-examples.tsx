import { Star } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface LiveTask {
  id: string;
  title: string;
  category: string;
  price: number;
  rating: number;
  avatar: string;
  userName: string;
}

const liveTasksData: LiveTask[] = [
  {
    id: '1',
    title: 'Pick up & deliver a medium sized fridge',
    category: 'Delivery',
    price: 100,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
    userName: 'Mike'
  },
  {
    id: '2',
    title: 'King mattress pick and delivery',
    category: 'Delivery',
    price: 85,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
    userName: 'Sarah'
  },
  {
    id: '3',
    title: 'Sofa delivery',
    category: 'Delivery',
    price: 95,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
    userName: 'David'
  },
  {
    id: '4',
    title: 'End of lease clean',
    category: 'Cleaning',
    price: 450,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
    userName: 'Emma'
  },
  {
    id: '5',
    title: 'End of lease clean',
    category: 'Cleaning',
    price: 750,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face',
    userName: 'James'
  },
  {
    id: '6',
    title: 'Couch moved 1km down the road',
    category: 'Removals',
    price: 60,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
    userName: 'Alex'
  },
  {
    id: '7',
    title: 'Removalist TODAY',
    category: 'Removals',
    price: 506,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
    userName: 'Lisa'
  },
  {
    id: '8',
    title: 'Urgent removalist',
    category: 'Removals',
    price: 450,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
    userName: 'Tom'
  },
  {
    id: '9',
    title: 'Help moving house',
    category: 'Removals',
    price: 500,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
    userName: 'Kate'
  },
  {
    id: '10',
    title: 'Break down and take away boxes',
    category: 'Removals',
    price: 150,
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face',
    userName: 'Ryan'
  }
];

interface LiveTaskExamplesProps {
  category?: 'delivery' | 'removals' | 'cleaning' | 'all';
}

export const LiveTaskExamples: React.FC<LiveTaskExamplesProps> = ({ category = 'all' }) => {
  const filteredTasks = category === 'all' 
    ? liveTasksData 
    : liveTasksData.filter(task => task.category.toLowerCase() === category);

  const displayTasks = filteredTasks.slice(0, 5);

  return (
    <div className="space-y-4">
      {displayTasks.map((task) => (
        <Link
          key={task.id}
          to={`/tasks/${task.id}`}
          className="block group"
        >
          <div className="flex items-center p-6 bg-white border border-neutral-200 rounded-xl hover:border-primary-300 hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] min-h-[120px]">
            <img
              src={task.avatar}
              alt={task.userName}
              className="w-16 h-16 rounded-full object-cover mr-4 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
                  {task.category}
                </span>
                <span className="text-xl font-bold text-neutral-900">
                  ${task.price}
                </span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors mb-3 leading-tight">
                {task.title}
              </h3>
              <div className="flex items-center">
                <div className="flex items-center">
                  {Array.from({ length: task.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-neutral-600 font-medium">
                  {task.rating} Stars • {task.userName}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'delivery', label: 'Moving in' },
    { id: 'removals', label: 'Home maintenance' },
    { id: 'cleaning', label: 'Starting a business' },
    { id: 'all', label: 'Parties' },
    { id: 'all', label: 'Something different' }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-neutral-900 font-heading">
        Browse by situation
      </h3>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
              activeCategory === category.id
                ? 'bg-primary-600 text-white shadow-lg scale-105'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 hover:shadow-md'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
};
