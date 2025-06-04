import { defineConfig } from 'eslint-define-config';
// Import the custom plugin for detecting duplicate utilities

export default defineConfig({
  root: true,
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
    'jsx-a11y'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    project: './tsconfig.json'
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {}
    }
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended'
  ],
  rules: {
    // File naming conventions
    'filenames/match-regex': ['error', '^[a-z0-9.-]+$', true], // Enforce kebab-case for non-component files
    'filenames/match-exported': ['error', 'pascal'], // PascalCase for component files
    
    // Import sorting
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],
    
    // Code style
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/naming-convention': [
      'error',
      // Variables & functions use camelCase
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase']
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase']
      },
      // Types use PascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase']
      },
      // Interfaces should be prefixed with 'I'
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false
        }
      },
      // Enum members use UPPER_CASE
      {
        selector: 'enumMember',
        format: ['UPPER_CASE']
      }
    ],
    
    // React rules
    'react/prop-types': 'off', // We use TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-pascal-case': 'error',
    'react/jsx-key': 'error',
    'react/display-name': 'off',
    
    // Accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-role': 'error',
    
    // Path-based imports (enforce absolute imports from @/ alias)
    'import/no-relative-parent-imports': 'error',
    
    // Error handling
    'no-throw-literal': 'error',
    
    // Prevent commented-out code
    'no-commented-out-code': 'warn'
  },
  overrides: [
    // Allow JSX in .tsx files
    {
      files: ['*.tsx'],
      rules: {
        'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }]
      }
    },
    // Different rules for test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    }
  ]
});
