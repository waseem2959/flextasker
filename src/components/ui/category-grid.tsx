/**
 * Category Selection Grid Component
 * 
 * Enhanced category selection grid aligned with project-map specifications.
 * Features visual icons, hover effects, and accessibility support.
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface CategoryOption {
  id: string;
  name: string;
  description?: string;
  icon?: LucideIcon;
  iconUrl?: string;
  color?: string;
  isPopular?: boolean;
  isDisabled?: boolean;
}

interface CategoryGridProps {
  categories: CategoryOption[];
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'large';
  showDescriptions?: boolean;
  showPopularBadge?: boolean;
}

/**
 * Individual category card component
 */
interface CategoryCardProps {
  category: CategoryOption;
  isSelected: boolean;
  variant: 'default' | 'compact' | 'large';
  showDescription: boolean;
  showPopularBadge: boolean;
  onSelect: (categoryId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected,
  variant,
  showDescription,
  showPopularBadge,
  onSelect
}) => {
  const IconComponent = category.icon;

  const sizeClasses = {
    compact: 'p-3 min-h-[80px]',
    default: 'p-6 min-h-[120px]',
    large: 'p-8 min-h-[160px]',
  };

  const iconSizes = {
    compact: 'w-6 h-6',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  // Extract text size logic
  const getTextSize = (variant: string, type: 'icon' | 'title') => {
    if (type === 'icon') {
      if (variant === 'compact') return 'text-xs';
      if (variant === 'large') return 'text-xl';
      return 'text-sm';
    }
    if (variant === 'compact') return 'text-sm';
    if (variant === 'large') return 'text-lg';
    return 'text-base';
  };

  // Extract border classes logic
  const getBorderClasses = () => {
    if (category.isDisabled) return 'opacity-50 cursor-not-allowed';
    if (isSelected) return 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10';
    return 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50 hover:-translate-y-1 hover:shadow-md';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !category.isDisabled) {
      e.preventDefault();
      onSelect(category.id);
    }
  };

  const handleClick = () => {
    if (!category.isDisabled) {
      onSelect(category.id);
    }
  };

  // Extract icon rendering logic
  const renderIcon = () => {
    if (IconComponent) {
      return <IconComponent className={iconSizes[variant]} />;
    }
    if (category.iconUrl) {
      return (
        <img
          src={category.iconUrl}
          alt={`${category.name} icon`}
          className={cn(iconSizes[variant], "object-contain")}
        />
      );
    }
    return (
      <div className={cn(
        iconSizes[variant],
        "bg-neutral-200 rounded-lg flex items-center justify-center text-neutral-500 font-bold",
        getTextSize(variant, 'icon')
      )}>
        {category.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <label
      className={cn(
        "relative bg-white border-2 rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center group",
        sizeClasses[variant],
        getBorderClasses()
      )}
    >
      <input
        type="radio"
        name="category-selection"
        value={category.id}
        checked={isSelected}
        disabled={category.isDisabled}
        onChange={handleClick}
        className="sr-only"
        onKeyDown={handleKeyDown}
      />
      {/* Popular badge */}
      {category.isPopular && showPopularBadge && (
        <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
          Popular
        </div>
      )}
      
      {/* Icon */}
      <div className={cn(
        "mb-3 transition-all duration-200",
        {
          "text-neutral-600 group-hover:text-primary-700": !isSelected,
          "text-primary-700": isSelected,
        }
      )}>
        {renderIcon()}
      </div>
      
      {/* Category name */}
      <h3 className={cn(
        "font-medium transition-colors duration-200 leading-tight",
        {
          "text-neutral-800 group-hover:text-primary-800": !isSelected,
          "text-primary-800": isSelected,
        },
        getTextSize(variant, 'title')
      )}>
        {category.name}
      </h3>
      
      {/* Description */}
      {category.description && showDescription && variant !== 'compact' && (
        <p className={cn(
          "text-neutral-600 mt-2 text-sm leading-relaxed",
          variant === 'large' ? 'text-base' : 'text-xs'
        )}>
          {category.description}
        </p>
      )}
    </label>
  );
};

/**
 * Main Category Grid component
 */
export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  className,
  variant = 'default',
  showDescriptions = true,
  showPopularBadge = true,
}) => {
  // Dynamic grid classes based on variant
  const gridClasses = {
    compact: 'grid-cols-[repeat(auto-fill,minmax(120px,1fr))]',
    default: 'grid-cols-[repeat(auto-fill,minmax(160px,1fr))]',
    large: 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]',
  };

  return (
    <div
      className={cn(
        "grid gap-4 w-full",
        gridClasses[variant],
        className
      )}
      role="radiogroup"
      aria-label="Select a category"
    >
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          isSelected={selectedCategory === category.id}
          variant={variant}
          showDescription={showDescriptions}
          showPopularBadge={showPopularBadge}
          onSelect={onCategorySelect}
        />
      ))}
    </div>
  );
};

/**
 * Compact category grid for tight spaces
 */
export const CompactCategoryGrid: React.FC<Omit<CategoryGridProps, 'variant' | 'showDescriptions'>> = (props) => (
  <CategoryGrid {...props} variant="compact" showDescriptions={false} />
);

/**
 * Large category grid for prominent selection
 */
export const LargeCategoryGrid: React.FC<Omit<CategoryGridProps, 'variant'>> = (props) => (
  <CategoryGrid {...props} variant="large" />
);

export default CategoryGrid;
