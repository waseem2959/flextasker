# FlexTasker Testing Guide

## 🎯 Overview

FlexTasker maintains a comprehensive test suite with **147 tests** achieving **100% pass rate**. This guide covers our testing strategy, best practices, and how to contribute to our test coverage.

## 📊 Current Test Coverage

### Test Suite Summary
- **Total Tests**: 147 passing, 0 failing
- **Test Suites**: 7 suites, all passing
- **Coverage**: Comprehensive coverage of critical components

### Coverage by Component
| Component | Tests | Status | Coverage |
|-----------|-------|--------|----------|
| App Component | 15 | ✅ 100% | Full routing & providers |
| Button Component | 25 | ✅ 100% | All variants & interactions |
| API Client | 11 | ✅ 100% | Core API functionality |
| Utils Library | 37 | ✅ 100% | All utility functions |
| Input Component | 35 | ✅ 100% | Complete form handling |
| Performance Monitor | 16 | ✅ 100% | Monitoring & analytics |
| Simple Tests | 6 | ✅ 100% | Basic functionality |
| useAuth Hook | 5 | ✅ 100% | Authentication flow |

## 🚀 Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Test-Specific Commands
```bash
# Run specific test file
npm test -- src/components/ui/__tests__/button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="Button Component"

# Run tests with verbose output
npm test -- --verbose
```

## 🧪 Test Structure

### Test Organization
```
src/
├── components/
│   ├── __tests__/
│   │   └── App.test.tsx
│   └── ui/
│       └── __tests__/
│           ├── button.test.tsx
│           └── input.test.tsx
├── services/
│   ├── api/
│   │   └── __tests__/
│   │       ├── api-client.test.ts
│   │       └── task-service.test.ts
│   └── monitoring/
│       └── __tests__/
│           └── performance-monitor.test.ts
├── hooks/
│   └── __tests__/
│       └── use-auth.test.ts
└── lib/
    └── __tests__/
        ├── utils.test.ts
        └── simple.test.ts
```

### Test Categories

#### 1. Component Tests
- **Purpose**: Test React component rendering and interactions
- **Tools**: React Testing Library, Jest
- **Coverage**: Props, events, accessibility, styling

#### 2. Service Tests
- **Purpose**: Test API services and business logic
- **Tools**: Jest with mocks
- **Coverage**: Success/error cases, data transformation

#### 3. Hook Tests
- **Purpose**: Test custom React hooks
- **Tools**: React Testing Library hooks
- **Coverage**: State management, side effects

#### 4. Utility Tests
- **Purpose**: Test pure functions and utilities
- **Tools**: Jest
- **Coverage**: Edge cases, input validation

## 📝 Writing Tests

### Test File Naming
- Component tests: `ComponentName.test.tsx`
- Service tests: `service-name.test.ts`
- Hook tests: `use-hook-name.test.ts`
- Utility tests: `utility-name.test.ts`

### Test Structure Template
```typescript
/**
 * Component/Service Tests
 * 
 * Description of what this test suite covers
 */

import { render, screen } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const props = { /* test props */ };
      
      // Act
      render(<ComponentName {...props} />);
      
      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
```

### Best Practices

#### 1. Test Organization
- Group related tests with `describe` blocks
- Use descriptive test names starting with "should"
- Follow Arrange-Act-Assert pattern

#### 2. Component Testing
```typescript
// ✅ Good: Test behavior, not implementation
expect(screen.getByRole('button')).toBeInTheDocument();

// ❌ Avoid: Testing implementation details
expect(wrapper.find('.button-class')).toHaveLength(1);
```

#### 3. Async Testing
```typescript
// ✅ Good: Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// ✅ Good: Use async/await with user events
await userEvent.click(screen.getByRole('button'));
```

#### 4. Mocking
```typescript
// ✅ Good: Mock external dependencies
jest.mock('../api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));
```

## 🔧 Test Configuration

### Jest Configuration
Located in `jest.config.js`:
- Test environment: jsdom
- Setup files: test utilities
- Coverage thresholds
- Module path mapping

### Testing Library Setup
- Custom render function with providers
- Common test utilities
- Accessibility testing helpers

## 📈 Coverage Goals

### Current Coverage Metrics
- **Statements**: 30.19% (Focus area for improvement)
- **Branches**: 19.89% (Needs attention)
- **Functions**: 41.07% (Good progress)
- **Lines**: 30.64% (Baseline established)

### Coverage Targets
- **Critical Components**: 90%+ coverage
- **API Services**: 80%+ coverage
- **Utility Functions**: 95%+ coverage
- **Overall Project**: 60%+ coverage

## 🚨 Troubleshooting

### Common Issues

#### 1. Test Timeouts
```bash
# Increase timeout for slow tests
jest.setTimeout(10000);
```

#### 2. Mock Issues
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### 3. Provider Wrapping
```typescript
// Wrap components that need providers
const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

renderHook(() => useAuth(), { wrapper });
```

## 🔄 Continuous Integration

### GitHub Actions
- Automated testing on push/PR
- Multiple Node.js versions
- Coverage reporting
- Build verification

### Quality Gates
- All tests must pass
- No TypeScript errors
- Linting compliance
- Security audit passing

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

1. Write tests for new features
2. Maintain existing test coverage
3. Follow naming conventions
4. Update documentation
5. Ensure all tests pass before PR
