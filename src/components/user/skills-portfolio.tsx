/**
 * Skills and Portfolio Component
 * 
 * User skills showcase and portfolio display using enhanced design system.
 * Implements project-map specifications for marketplace user profiles.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Award, Calendar, ChevronLeft, ChevronRight, ExternalLink, Eye, Heart, MapPin, Star } from 'lucide-react';
import React, { useState } from 'react';

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience?: number;
  isVerified?: boolean;
  endorsements?: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  completedAt: Date;
  location?: string;
  rating?: number;
  clientFeedback?: string;
  tags: string[];
  isPublic: boolean;
  views?: number;
  likes?: number;
}

interface SkillsDisplayProps {
  skills: Skill[];
  maxVisible?: number;
  showLevels?: boolean;
  className?: string;
}

interface PortfolioDisplayProps {
  items: PortfolioItem[];
  layout?: 'grid' | 'carousel';
  maxVisible?: number;
  className?: string;
}

interface SkillsPortfolioProps {
  skills: Skill[];
  portfolio: PortfolioItem[];
  className?: string;
}

/**
 * Skills Display Component
 */
export const SkillsDisplay: React.FC<SkillsDisplayProps> = ({
  skills,
  maxVisible = 10,
  showLevels = true,
  className,
}) => {
  const [showAll, setShowAll] = useState(false);
  
  const visibleSkills = showAll ? skills : skills.slice(0, maxVisible);
  const hiddenCount = skills.length - maxVisible;

  const getLevelColor = (level: Skill['level']) => {
    switch (level) {
      case 'expert':
        return 'bg-primary-500 text-white border-primary-500';
      case 'advanced':
        return 'bg-primary-300 text-primary-900 border-primary-400';
      case 'intermediate':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'beginner':
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const getLevelLabel = (level: Skill['level']) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className={cn("skills-display", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-neutral-900">
          Skills & Expertise
        </h3>
        {hiddenCount > 0 && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="text-primary-600 hover:text-primary-700"
          >
            +{hiddenCount} more
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleSkills.map((skill) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Badge
              variant="outline"
              className={cn(
                "relative px-3 py-1.5 font-medium border-2 transition-all duration-200 hover:shadow-md",
                getLevelColor(skill.level)
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-body">{skill.name}</span>
                
                {skill.isVerified && (
                  <Award className="w-3 h-3 text-current" />
                )}
                
                {showLevels && (
                  <span className="text-xs opacity-75">
                    {getLevelLabel(skill.level)}
                  </span>
                )}
              </div>
              
              {skill.endorsements && skill.endorsements > 0 && (
                <div className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {skill.endorsements}
                </div>
              )}
            </Badge>
          </motion.div>
        ))}
      </div>

      {showAll && hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(false)}
          className="mt-3 text-neutral-600 hover:text-neutral-700"
        >
          Show less
        </Button>
      )}
    </div>
  );
};

/**
 * Portfolio Display Component
 */
export const PortfolioDisplay: React.FC<PortfolioDisplayProps> = ({
  items,
  layout = 'grid',
  maxVisible = 6,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [_selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  
  const visibleItems = items.slice(0, maxVisible);

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleItems.length);
  };

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
  };

  const PortfolioCard: React.FC<{ item: PortfolioItem; index: number }> = ({ item, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="group cursor-pointer"
      onClick={() => setSelectedItem(item)}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Overlay info */}
          <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.views && (
                  <div className="flex items-center gap-1 text-xs">
                    <Eye className="w-3 h-3" />
                    {item.views}
                  </div>
                )}
                {item.likes && (
                  <div className="flex items-center gap-1 text-xs">
                    <Heart className="w-3 h-3" />
                    {item.likes}
                  </div>
                )}
              </div>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-heading font-semibold text-neutral-900 line-clamp-1">
              {item.title}
            </h4>
            {item.rating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{item.rating}</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-neutral-600 font-body line-clamp-2 mb-3">
            {item.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {item.completedAt.toLocaleDateString()}
            </div>
            {item.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {item.location}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className={cn("portfolio-display", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-semibold text-neutral-900">
          Portfolio
        </h3>
        <div className="text-sm text-neutral-600 font-body">
          {items.length} {items.length === 1 ? 'project' : 'projects'}
        </div>
      </div>

      {layout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.map((item, index) => (
            <PortfolioCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex transition-transform duration-300"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {visibleItems.map((item, index) => (
                <div key={item.id} className="w-full flex-shrink-0 px-2">
                  <PortfolioCard item={item} index={index} />
                </div>
              ))}
            </motion.div>
          </div>
          
          {visibleItems.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={prevItem}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full w-10 h-10 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextItem}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full w-10 h-10 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {items.length > maxVisible && (
        <div className="text-center mt-6">
          <Button variant="outline" className="text-primary-600 border-primary-300 hover:bg-primary-50">
            View All Projects ({items.length})
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Combined Skills and Portfolio Component
 */
export const SkillsPortfolio: React.FC<SkillsPortfolioProps> = ({
  skills,
  portfolio,
  className,
}) => {
  return (
    <div className={cn("skills-portfolio space-y-8", className)}>
      <SkillsDisplay skills={skills} />
      <PortfolioDisplay items={portfolio} />
    </div>
  );
};

export default SkillsPortfolio;
