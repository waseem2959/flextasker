/**
 * Category Utilities
 * 
 * Centralized category-related utilities including image mapping,
 * color schemes, and category information
 */

import { TaskCategory } from '@/types';

/**
 * Category display information
 */
export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  color: string;
  bgColor: string;
}

/**
 * Default category images mapping
 */
export const categoryImages: Record<TaskCategory, string> = {
  [TaskCategory.WEB_DEVELOPMENT]: '/images/categories/web-development.jpg',
  [TaskCategory.MOBILE_DEVELOPMENT]: '/images/categories/mobile-development.jpg',
  [TaskCategory.DESIGN]: '/images/categories/design.jpg',
  [TaskCategory.WRITING]: '/images/categories/writing.jpg',
  [TaskCategory.MARKETING]: '/images/categories/marketing.jpg',
  [TaskCategory.DATA_ENTRY]: '/images/categories/data-entry.jpg',
  [TaskCategory.TRANSLATION]: '/images/categories/translation.jpg',
  [TaskCategory.CONSULTING]: '/images/categories/consulting.jpg',
  [TaskCategory.OTHER]: '/images/categories/other.jpg',
};

/**
 * Category color schemes
 */
export const categoryColors: Record<TaskCategory, { color: string; bgColor: string }> = {
  [TaskCategory.WEB_DEVELOPMENT]: { color: 'text-blue-700', bgColor: 'bg-blue-100' },
  [TaskCategory.MOBILE_DEVELOPMENT]: { color: 'text-green-700', bgColor: 'bg-green-100' },
  [TaskCategory.DESIGN]: { color: 'text-purple-700', bgColor: 'bg-purple-100' },
  [TaskCategory.WRITING]: { color: 'text-orange-700', bgColor: 'bg-orange-100' },
  [TaskCategory.MARKETING]: { color: 'text-pink-700', bgColor: 'bg-pink-100' },
  [TaskCategory.DATA_ENTRY]: { color: 'text-gray-700', bgColor: 'bg-gray-100' },
  [TaskCategory.TRANSLATION]: { color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  [TaskCategory.CONSULTING]: { color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  [TaskCategory.OTHER]: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
};

/**
 * Category display names
 */
export const categoryDisplayNames: Record<TaskCategory, string> = {
  [TaskCategory.WEB_DEVELOPMENT]: 'Web Development',
  [TaskCategory.MOBILE_DEVELOPMENT]: 'Mobile Development',
  [TaskCategory.DESIGN]: 'Design & Creative',
  [TaskCategory.WRITING]: 'Writing & Content',
  [TaskCategory.MARKETING]: 'Marketing & Sales',
  [TaskCategory.DATA_ENTRY]: 'Data Entry',
  [TaskCategory.TRANSLATION]: 'Translation',
  [TaskCategory.CONSULTING]: 'Consulting',
  [TaskCategory.OTHER]: 'Other',
};

/**
 * Category descriptions
 */
export const categoryDescriptions: Record<TaskCategory, string> = {
  [TaskCategory.WEB_DEVELOPMENT]: 'Frontend, backend, and full-stack web development',
  [TaskCategory.MOBILE_DEVELOPMENT]: 'iOS, Android, and cross-platform mobile apps',
  [TaskCategory.DESIGN]: 'Graphic design, UI/UX, branding, and creative work',
  [TaskCategory.WRITING]: 'Content writing, copywriting, and editing',
  [TaskCategory.MARKETING]: 'Digital marketing, SEO, social media, and advertising',
  [TaskCategory.DATA_ENTRY]: 'Data processing, entry, and clerical work',
  [TaskCategory.TRANSLATION]: 'Language translation and localization',
  [TaskCategory.CONSULTING]: 'Business consulting and professional advice',
  [TaskCategory.OTHER]: 'Miscellaneous tasks and services',
};

/**
 * Get default image for a category
 */
export const getCategoryDefaultImage = (category: TaskCategory | string): string => {
  if (typeof category === 'string') {
    // Handle string category IDs
    const categoryEnum = Object.values(TaskCategory).find(cat => cat === category);
    if (categoryEnum) {
      return categoryImages[categoryEnum];
    }
  } else {
    return categoryImages[category];
  }
  
  return categoryImages[TaskCategory.OTHER];
};

/**
 * Get category color scheme
 */
export const getCategoryColors = (category: TaskCategory | string): { color: string; bgColor: string } => {
  if (typeof category === 'string') {
    const categoryEnum = Object.values(TaskCategory).find(cat => cat === category) as TaskCategory;
    if (categoryEnum) {
      return categoryColors[categoryEnum];
    }
  } else {
    return categoryColors[category];
  }
  
  return categoryColors[TaskCategory.OTHER];
};

/**
 * Get category display name
 */
export const getCategoryDisplayName = (category: TaskCategory | string): string => {
  if (typeof category === 'string') {
    const categoryEnum = Object.values(TaskCategory).find(cat => cat === category) as TaskCategory;
    if (categoryEnum) {
      return categoryDisplayNames[categoryEnum];
    }
    // Fallback: capitalize and replace underscores
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  return categoryDisplayNames[category];
};

/**
 * Get category description
 */
export const getCategoryDescription = (category: TaskCategory | string): string => {
  if (typeof category === 'string') {
    const categoryEnum = Object.values(TaskCategory).find(cat => cat === category) as TaskCategory;
    if (categoryEnum) {
      return categoryDescriptions[categoryEnum];
    }
  } else {
    return categoryDescriptions[category];
  }
  
  return categoryDescriptions[TaskCategory.OTHER];
};

/**
 * Get complete category information
 */
export const getCategoryInfo = (category: TaskCategory | string): CategoryInfo => {
  const colors = getCategoryColors(category);
  
  return {
    id: typeof category === 'string' ? category : category,
    name: getCategoryDisplayName(category),
    description: getCategoryDescription(category),
    icon: getCategoryDefaultImage(category),
    image: getCategoryDefaultImage(category),
    color: colors.color,
    bgColor: colors.bgColor,
  };
};

/**
 * Get all available categories as info objects
 */
export const getAllCategories = (): CategoryInfo[] => {
  return Object.values(TaskCategory).map(category => getCategoryInfo(category));
};

/**
 * Search categories by name or description
 */
export const searchCategories = (query: string): CategoryInfo[] => {
  const lowercaseQuery = query.toLowerCase();
  return getAllCategories().filter(category =>
    category.name.toLowerCase().includes(lowercaseQuery) ||
    category.description.toLowerCase().includes(lowercaseQuery)
  );
};