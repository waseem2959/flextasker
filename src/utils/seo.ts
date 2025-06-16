/**
 * SEO Utilities
 * 
 * This file provides SEO-related utility functions for meta tags,
 * structured data, and other SEO optimizations.
 */

export interface MetaTagsConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

/**
 * Generate meta tags for SEO
 */
export function generateMetaTags(config: MetaTagsConfig): Record<string, string> {
  const metaTags: Record<string, string> = {};

  if (config.title) {
    metaTags['title'] = config.title;
    metaTags['og:title'] = config.title;
    metaTags['twitter:title'] = config.title;
  }

  if (config.description) {
    metaTags['description'] = config.description;
    metaTags['og:description'] = config.description;
    metaTags['twitter:description'] = config.description;
  }

  if (config.keywords && config.keywords.length > 0) {
    metaTags['keywords'] = config.keywords.join(', ');
  }

  if (config.author) {
    metaTags['author'] = config.author;
  }

  if (config.image) {
    metaTags['og:image'] = config.image;
    metaTags['twitter:image'] = config.image;
  }

  if (config.url) {
    metaTags['og:url'] = config.url;
    metaTags['canonical'] = config.url;
  }

  if (config.type) {
    metaTags['og:type'] = config.type;
  }

  if (config.siteName) {
    metaTags['og:site_name'] = config.siteName;
  }

  // Default Twitter card type
  metaTags['twitter:card'] = 'summary_large_image';

  return metaTags;
}

/**
 * Generate structured data for SEO
 */
export function generateStructuredData(type: string, data: any): string {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return JSON.stringify(structuredData);
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>): string {
  const itemListElement = breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url
  }));

  return generateStructuredData('BreadcrumbList', {
    itemListElement
  });
}

/**
 * Generate organization structured data
 */
export function generateOrganizationStructuredData(org: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: any;
  contactPoint?: any;
}): string {
  return generateStructuredData('Organization', org);
}

/**
 * Generate website structured data
 */
export function generateWebsiteStructuredData(site: {
  name: string;
  url: string;
  description?: string;
  potentialAction?: any;
}): string {
  return generateStructuredData('WebSite', site);
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>): string {
  const mainEntity = faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }));

  return generateStructuredData('FAQPage', {
    mainEntity
  });
}

/**
 * Generate service structured data
 */
export function generateServiceStructuredData(service: {
  name: string;
  description: string;
  provider: any;
  areaServed?: string;
  serviceType?: string;
}): string {
  return generateStructuredData('Service', service);
}

/**
 * Apply meta tags to document head
 */
export function applyMetaTags(metaTags: Record<string, string>): void {
  if (typeof document === 'undefined') return;

  Object.entries(metaTags).forEach(([name, content]) => {
    let selector = '';
    let attribute = '';

    if (name === 'title') {
      document.title = content;
      return;
    } else if (name === 'canonical') {
      selector = 'link[rel="canonical"]';
      attribute = 'href';
    } else if (name.startsWith('og:') || name.startsWith('twitter:')) {
      selector = `meta[property="${name}"]`;
      attribute = 'content';
    } else {
      selector = `meta[name="${name}"]`;
      attribute = 'content';
    }

    let element = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement;

    if (!element) {
      if (name === 'canonical') {
        element = document.createElement('link');
        (element as HTMLLinkElement).rel = 'canonical';
      } else {
        element = document.createElement('meta');
        if (name.startsWith('og:') || name.startsWith('twitter:')) {
          (element as HTMLMetaElement).setAttribute('property', name);
        } else {
          (element as HTMLMetaElement).name = name;
        }
      }
      document.head.appendChild(element);
    }

    element.setAttribute(attribute, content);
  });
}

/**
 * Apply structured data to document head
 */
export function applyStructuredData(structuredData: string): void {
  if (typeof document === 'undefined') return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = structuredData;
  document.head.appendChild(script);
}

/**
 * Generate sitemap URL list
 */
export function generateSitemapUrls(urls: Array<{
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}>): string {
  const urlElements = urls.map(url => {
    let urlXml = `  <url>\n    <loc>${url.loc}</loc>\n`;
    
    if (url.lastmod) {
      urlXml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    
    if (url.changefreq) {
      urlXml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    
    if (url.priority !== undefined) {
      urlXml += `    <priority>${url.priority}</priority>\n`;
    }
    
    urlXml += '  </url>';
    return urlXml;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

// Export default object for backward compatibility
export default {
  generateMetaTags,
  generateStructuredData,
  generateBreadcrumbStructuredData,
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
  generateFAQStructuredData,
  generateServiceStructuredData,
  applyMetaTags,
  applyStructuredData,
  generateSitemapUrls
};
