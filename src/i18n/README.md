# Internationalization (i18n) Setup

This directory contains the internationalization configuration for the Flextasker application, enabling multi-language support.

## Required Packages

To use the i18n functionality, install the following packages:

```bash
npm install i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

## Structure

- `i18n-config.ts` - Main configuration file
- `use-translation.ts` - Type-safe translation hook
- `formatters.ts` - Date, number, and currency formatters
- `locales/` - Translation JSON files (to be added in the public directory)

## Usage

### Initialize i18n

In your application entry point (e.g., `main.tsx`):

```tsx
import { initI18n } from './i18n/i18n-config';

// Initialize i18n before rendering the app
await initI18n();

// Then render your app
```

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.message', { name: 'User' })}</p>
    </div>
  );
}
```

### Changing Language

```tsx
import { changeLanguage } from './i18n/i18n-config';

// Switch to Arabic
changeLanguage('ar');
```

## Adding New Languages

1. Add the language to `SUPPORTED_LANGUAGES` in `i18n-config.ts`
2. Create translation files in `/public/locales/[language-code]/`
3. For RTL languages, ensure proper styling support

## Translation Files Structure

Each language should have translation files for each namespace:

```
/public/locales/
  /en/
    common.json
    auth.json
    tasks.json
    ...
  /ar/
    common.json
    auth.json
    tasks.json
    ...
```

## Translation File Example

```json
// common.json
{
  "welcome": {
    "title": "Welcome to Flextasker",
    "message": "Hello, {{name}}!"
  },
  "navigation": {
    "home": "Home",
    "tasks": "Tasks",
    "dashboard": "Dashboard"
  }
}
```

## RTL Support

For RTL languages like Arabic, the configuration automatically:

1. Sets the document direction to RTL
2. Adds an 'rtl' class to the document
3. Uses appropriate font stacks
