/**
 * SEO Utilities
 * 
 * This file contains utilities for managing SEO-related aspects of the application,
 * including meta tags, structured data, and other search engine optimization techniques.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Interface for structured data
 */
export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * Interface for metadata properties
 */
export interface MetaTagProps {
  /**
   * Page title
   */
  title?: string;
  
  /**
   * Page description
   */
  description?: string;
  
  /**
   * Canonical URL
   */
  canonicalUrl?: string;
  
  /**
   * Open Graph title (defaults to title if not provided)
   */
  ogTitle?: string;
  
  /**
   * Open Graph description (defaults to description if not provided)
   */
  ogDescription?: string;
  
  /**
   * Open Graph image URL
   */
  ogImage?: string;
  
  /**
   * Open Graph type (defaults to website)
   */
  ogType?: 'website' | 'article' | 'profile' | 'book' | 'music.song' | 'music.album' | 'music.playlist' | 'video.movie' | 'video.tv_show' | 'video.episode';
  
  /**
   * Twitter card type
   */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  
  /**
   * Twitter site handle
   */
  twitterSite?: string;
  
  /**
   * Twitter creator handle
   */
  twitterCreator?: string;
  
  /**
   * Article published time (for articles)
   */
  articlePublishedTime?: string;
  
  /**
   * Article modified time (for articles)
   */
  articleModifiedTime?: string;
  
  /**
   * Article author (for articles)
   */
  articleAuthor?: string;
  
  /**
   * Article section (for articles)
   */
  articleSection?: string;
  
  /**
   * Article tags (for articles)
   */
  articleTags?: string[];
  
  /**
   * Structured data (JSON-LD)
   */
  structuredData?: StructuredData | StructuredData[];
  
  /**
   * Additional meta tags
   */
  additionalMetaTags?: {
    name?: string;
    property?: string;
    content: string;
    key?: string;
  }[];
  
  /**
   * No index directive
   */
  noindex?: boolean;
  
  /**
   * No follow directive
   */
  nofollow?: boolean;
  
  /**
   * robots directive
   */
  robotsProps?: {
    nosnippet?: boolean;
    noimageindex?: boolean;
    noarchive?: boolean;
    maxSnippet?: number;
    maxImagePreview?: 'none' | 'standard' | 'large';
    maxVideoPreview?: number;
    notranslate?: boolean;
  };
  
  /**
   * Language of the page
   */
  language?: string;
}

/**
 * Default SEO configuration that will be merged with page-specific settings
 */
export const defaultSeoConfig: MetaTagProps = {
  title: 'Flextasker | Find Skilled Task Doers Nearby',
  description: 'Flextasker helps you find skilled individuals to complete your tasks efficiently and affordably. Post a task or offer your skills today!',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterSite: '@flextasker',
  ogImage: '/images/flextasker-social-card.jpg',
  language: 'en',
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=5',
    },
    {
      name: 'theme-color',
      content: '#15919B',
    },
    {
      name: 'application-name',
      content: 'Flextasker',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'default',
    },
    {
      name: 'apple-mobile-web-app-title',
      content: 'Flextasker',
    },
    {
      name: 'format-detection',
      content: 'telephone=no',
    },
    {
      name: 'mobile-web-app-capable',
      content: 'yes',
    },
  ],
};

/**
 * Helper function to add basic robots directives
 */
const addBasicRobotsDirectives = (config: MetaTagProps): string[] => {
  const directives: string[] = [];

  if (config.noindex) directives.push('noindex');
  if (config.nofollow) directives.push('nofollow');

  return directives;
};

/**
 * Helper function to add advanced robots directives
 */
const addAdvancedRobotsDirectives = (robotsProps: NonNullable<MetaTagProps['robotsProps']>): string[] => {
  const directives: string[] = [];

  if (robotsProps.nosnippet) directives.push('nosnippet');
  if (robotsProps.noimageindex) directives.push('noimageindex');
  if (robotsProps.noarchive) directives.push('noarchive');
  if (robotsProps.notranslate) directives.push('notranslate');

  return directives;
};

/**
 * Helper function to add parameterized robots directives
 */
const addParameterizedRobotsDirectives = (robotsProps: NonNullable<MetaTagProps['robotsProps']>): string[] => {
  const directives: string[] = [];

  if (robotsProps.maxSnippet !== undefined) {
    directives.push(`max-snippet:${robotsProps.maxSnippet}`);
  }

  if (robotsProps.maxImagePreview !== undefined) {
    directives.push(`max-image-preview:${robotsProps.maxImagePreview}`);
  }

  if (robotsProps.maxVideoPreview !== undefined) {
    directives.push(`max-video-preview:${robotsProps.maxVideoPreview}`);
  }

  return directives;
};

/**
 * Helper function to build robots meta content
 */
const buildRobotsContent = (config: MetaTagProps): string => {
  const directives: string[] = [];

  // Add basic directives
  directives.push(...addBasicRobotsDirectives(config));

  // Add advanced directives if robotsProps exists
  if (config.robotsProps) {
    directives.push(...addAdvancedRobotsDirectives(config.robotsProps));
    directives.push(...addParameterizedRobotsDirectives(config.robotsProps));
  }

  return directives.join(', ');
};

/**
 * Helper component for rendering article meta tags
 */
const ArticleMetaTags: React.FC<{ config: MetaTagProps }> = ({ config }) => {
  if (config.ogType !== 'article') return null;

  return (
    <>
      {config.articlePublishedTime && (
        <meta property="article:published_time" content={config.articlePublishedTime} />
      )}
      {config.articleModifiedTime && (
        <meta property="article:modified_time" content={config.articleModifiedTime} />
      )}
      {config.articleAuthor && (
        <meta property="article:author" content={config.articleAuthor} />
      )}
      {config.articleSection && (
        <meta property="article:section" content={config.articleSection} />
      )}
      {config.articleTags?.map((tag) => (
        <meta key={`article-tag-${tag}`} property="article:tag" content={tag} />
      ))}
    </>
  );
};

/**
 * Helper component for rendering additional meta tags
 */
const AdditionalMetaTags: React.FC<{ tags: MetaTagProps['additionalMetaTags'] }> = ({ tags }) => {
  if (!tags) return null;

  return (
    <>
      {tags.map((tag) => (
        <meta
          key={tag.key ?? `meta-${tag.name ?? tag.property}-${tag.content}`}
          {...(tag.name ? { name: tag.name } : {})}
          {...(tag.property ? { property: tag.property } : {})}
          content={tag.content}
        />
      ))}
    </>
  );
};

/**
 * SEO Component for managing meta tags
 *
 * @example
 * <SEO
 *   title="Task Details | Flextasker"
 *   description="View task details and make an offer"
 *   ogImage={task.imageUrl}
 * />
 */
export const SEO: React.FC<MetaTagProps> = (props) => {
  // Merge with default configuration
  const config = { ...defaultSeoConfig, ...props };

  // Set defaults for Open Graph if not provided
  const ogTitle = config.ogTitle ?? config.title;
  const ogDescription = config.ogDescription ?? config.description;

  // Build robots meta content
  const robotsContent = buildRobotsContent(config);

  return (
    <Helmet>
      {/* Standard meta tags */}
      {config.title && <title>{config.title}</title>}
      {config.description && <meta name="description" content={config.description} />}
      {config.canonicalUrl && <link rel="canonical" href={config.canonicalUrl} />}
      {robotsContent && <meta name="robots" content={robotsContent} />}
      {config.language && <html lang={config.language} />}

      {/* Open Graph meta tags */}
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      {config.ogImage && <meta property="og:image" content={config.ogImage} />}
      {config.ogType && <meta property="og:type" content={config.ogType} />}
      {config.canonicalUrl && <meta property="og:url" content={config.canonicalUrl} />}

      {/* Twitter card meta tags */}
      {config.twitterCard && <meta name="twitter:card" content={config.twitterCard} />}
      {config.twitterSite && <meta name="twitter:site" content={config.twitterSite} />}
      {config.twitterCreator && <meta name="twitter:creator" content={config.twitterCreator} />}
      {ogTitle && <meta name="twitter:title" content={ogTitle} />}
      {ogDescription && <meta name="twitter:description" content={ogDescription} />}
      {config.ogImage && <meta name="twitter:image" content={config.ogImage} />}

      {/* Article meta tags */}
      <ArticleMetaTags config={config} />

      {/* Additional meta tags */}
      <AdditionalMetaTags tags={config.additionalMetaTags} />

      {/* Structured data (JSON-LD) */}
      {config.structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(config.structuredData)}
        </script>
      )}
    </Helmet>
  );
};

/**
 * Generate structured data for a breadcrumb
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url,
    })),
  };
}

/**
 * Generate structured data for an organization
 */
export function generateOrganizationSchema(props: {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': props.name,
    'url': props.url,
    'logo': props.logo,
    ...(props.sameAs ? { 'sameAs': props.sameAs } : {}),
  };
}

/**
 * Generate structured data for a local business
 */
export function generateLocalBusinessSchema(props: {
  name: string;
  url: string;
  logo: string;
  telephone: string;
  priceRange: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': props.name,
    'url': props.url,
    'logo': props.logo,
    'telephone': props.telephone,
    'priceRange': props.priceRange,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': props.address.streetAddress,
      'addressLocality': props.address.addressLocality,
      'addressRegion': props.address.addressRegion,
      'postalCode': props.address.postalCode,
      'addressCountry': props.address.addressCountry,
    },
    ...(props.geo ? {
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': props.geo.latitude,
        'longitude': props.geo.longitude,
      },
    } : {}),
    ...(props.openingHours ? { 'openingHours': props.openingHours } : {}),
  };
}

/**
 * Generate structured data for a product
 */
export function generateProductSchema(props: {
  name: string;
  image: string | string[];
  description: string;
  sku?: string;
  brand?: { name: string; url?: string };
  offers: {
    price: number;
    priceCurrency: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    url?: string;
    validFrom?: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': props.name,
    'image': props.image,
    'description': props.description,
    ...(props.sku ? { 'sku': props.sku } : {}),
    ...(props.brand ? {
      'brand': {
        '@type': 'Brand',
        'name': props.brand.name,
        ...(props.brand.url ? { 'url': props.brand.url } : {}),
      },
    } : {}),
    'offers': {
      '@type': 'Offer',
      'price': props.offers.price,
      'priceCurrency': props.offers.priceCurrency,
      ...(props.offers.availability ? { 'availability': `https://schema.org/${props.offers.availability}` } : {}),
      ...(props.offers.url ? { 'url': props.offers.url } : {}),
      ...(props.offers.validFrom ? { 'validFrom': props.offers.validFrom } : {}),
      ...(props.offers.priceValidUntil ? { 'priceValidUntil': props.offers.priceValidUntil } : {}),
    },
    ...(props.aggregateRating ? {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': props.aggregateRating.ratingValue,
        'reviewCount': props.aggregateRating.reviewCount,
      },
    } : {}),
  };
}

/**
 * Generate structured data for a person
 */
export function generatePersonSchema(props: {
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  worksFor?: { name: string; url?: string };
  sameAs?: string[];
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': props.name,
    ...(props.url ? { 'url': props.url } : {}),
    ...(props.image ? { 'image': props.image } : {}),
    ...(props.jobTitle ? { 'jobTitle': props.jobTitle } : {}),
    ...(props.worksFor ? {
      'worksFor': {
        '@type': 'Organization',
        'name': props.worksFor.name,
        ...(props.worksFor.url ? { 'url': props.worksFor.url } : {}),
      },
    } : {}),
    ...(props.sameAs ? { 'sameAs': props.sameAs } : {}),
  };
}

/**
 * Generate structured data for an FAQ page
 */
export function generateFAQSchema(questions: { question: string; answer: string }[]): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': questions.map(q => ({
      '@type': 'Question',
      'name': q.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': q.answer,
      },
    })),
  };
}

/**
 * Generate structured data for a job posting
 */
export function generateJobPostingSchema(props: {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY' | 'INTERN' | 'VOLUNTEER' | 'PER_DIEM' | 'OTHER';
  hiringOrganization: { name: string; url?: string; logo?: string };
  jobLocation?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  baseSalary?: {
    currency: string;
    value: number;
    unitText: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  };
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    'title': props.title,
    'description': props.description,
    'datePosted': props.datePosted,
    ...(props.validThrough ? { 'validThrough': props.validThrough } : {}),
    ...(props.employmentType ? { 'employmentType': props.employmentType } : {}),
    'hiringOrganization': {
      '@type': 'Organization',
      'name': props.hiringOrganization.name,
      ...(props.hiringOrganization.url ? { 'url': props.hiringOrganization.url } : {}),
      ...(props.hiringOrganization.logo ? { 'logo': props.hiringOrganization.logo } : {}),
    },
    ...(props.jobLocation ? {
      'jobLocation': {
        '@type': 'Place',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': props.jobLocation.streetAddress,
          'addressLocality': props.jobLocation.addressLocality,
          'addressRegion': props.jobLocation.addressRegion,
          'postalCode': props.jobLocation.postalCode,
          'addressCountry': props.jobLocation.addressCountry,
        },
      },
    } : {}),
    ...(props.baseSalary ? {
      'baseSalary': {
        '@type': 'MonetaryAmount',
        'currency': props.baseSalary.currency,
        'value': {
          '@type': 'QuantitativeValue',
          'value': props.baseSalary.value,
          'unitText': props.baseSalary.unitText,
        },
      },
    } : {}),
  };
}

export default {
  SEO,
  defaultSeoConfig,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateProductSchema,
  generatePersonSchema,
  generateFAQSchema,
  generateJobPostingSchema,
};
