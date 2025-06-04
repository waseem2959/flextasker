# SEO Implementation Requirements

## Required Dependencies

To use the SEO utilities properly, you need to install the following dependencies:

```bash
npm install react-helmet-async
```

## Setup in the Application

After installing the dependencies, you need to wrap your application with the `HelmetProvider` from `react-helmet-async`:

```tsx
// In your App.tsx or main entry file
import { HelmetProvider } from 'react-helmet-async';

const App = () => (
  <HelmetProvider>
    <BrowserRouter>
      <ReactQueryProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Routes>
              {/* Your routes here */}
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </BrowserRouter>
  </HelmetProvider>
);
```

## Usage

Once the setup is complete, you can use the SEO component in any of your pages:

```tsx
import { SEO } from '@/utils/seo';

const TaskDetailPage = () => {
  return (
    <>
      <SEO 
        title="Task Details | Flextasker"
        description="View task details and submit your offer"
        ogImage={task.imageUrl}
      />
      {/* Page content */}
    </>
  );
};
```

## Structured Data Usage

You can also use the structured data generators to add rich schema markup to your pages:

```tsx
import { SEO, generateProductSchema } from '@/utils/seo';

const ProductPage = () => {
  const productSchema = generateProductSchema({
    name: 'Task: Website Development',
    image: 'https://example.com/task-image.jpg',
    description: 'Need help building a responsive website with modern design',
    offers: {
      price: 500,
      priceCurrency: 'USD',
      availability: 'InStock'
    }
  });

  return (
    <>
      <SEO 
        title="Website Development Task | Flextasker"
        description="Task details for website development project"
        structuredData={productSchema}
      />
      {/* Page content */}
    </>
  );
};
```

## Type Definitions

If you're encountering type errors with `react-helmet-async`, you can create a declaration file in `src/types/declarations/react-helmet-async.d.ts`:

```typescript
declare module 'react-helmet-async' {
  import React from 'react';
  
  export interface HelmetProps {
    defer?: boolean;
    encodeSpecialCharacters?: boolean;
    children?: React.ReactNode;
    [prop: string]: any;
  }
  
  export class Helmet extends React.Component<HelmetProps> {
    static renderStatic(): {
      base: any;
      bodyAttributes: any;
      htmlAttributes: any;
      link: any;
      meta: any;
      noscript: any;
      script: any;
      style: any;
      title: any;
    };
  }
  
  export interface ProviderProps {
    context?: object;
    children: React.ReactNode;
  }
  
  export class HelmetProvider extends React.Component<ProviderProps> {}
}
```

This should resolve any TypeScript errors related to the SEO implementation.
