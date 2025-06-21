/**
 * Page Header Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PageHeader, PageContainer, PageLayout } from '../page-header';

// Mock useNavigate
const mockNavigate = jest.fn();

// Mock the hook at module level
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('PageHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with title only', () => {
    render(<PageHeader title="Test Page" />);
    
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Page');
  });

  it('renders with title and subtitle', () => {
    render(
      <PageHeader 
        title="Test Page" 
        subtitle="This is a test page subtitle" 
      />
    );
    
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('This is a test page subtitle')).toBeInTheDocument();
  });

  it('renders back button when showBackButton is true', () => {
    render(
      <BrowserRouter>
        <PageHeader title="Test Page" showBackButton />
      </BrowserRouter>
    );
    
    const backButton = screen.getByText('Back');
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest('button')).toBeInTheDocument();
  });

  it('calls navigate(-1) when back button is clicked without backUrl', () => {
    render(
      <PageHeader title="Test Page" showBackButton />
    );
    
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to specific URL when backUrl is provided', () => {
    render(
      <PageHeader title="Test Page" showBackButton backUrl="/dashboard" />
    );
    
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('renders actions when provided', () => {
    const actions = (
      <button data-testid="action-button">Action</button>
    );
    
    render(<PageHeader title="Test Page" actions={actions} />);
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  it('renders children in the content area', () => {
    render(
      <PageHeader title="Test Page">
        <div data-testid="page-content">Custom content</div>
      </PageHeader>
    );
    
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PageHeader title="Test Page" className="custom-class" />
    );
    
    const header = container.firstChild;
    expect(header).toHaveClass('custom-class');
  });
});

describe('PageContainer', () => {
  it('renders children with default max width', () => {
    render(
      <PageContainer>
        <div data-testid="container-content">Content</div>
      </PageContainer>
    );
    
    const container = screen.getByTestId('container-content').parentElement;
    expect(container).toHaveClass('max-w-7xl');
    expect(screen.getByTestId('container-content')).toBeInTheDocument();
  });

  it('applies custom max width', () => {
    render(
      <PageContainer maxWidth="sm">
        <div data-testid="container-content">Content</div>
      </PageContainer>
    );
    
    const container = screen.getByTestId('container-content').parentElement;
    expect(container).toHaveClass('max-w-sm');
  });

  it('applies custom className', () => {
    render(
      <PageContainer className="custom-container">
        <div data-testid="container-content">Content</div>
      </PageContainer>
    );
    
    const container = screen.getByTestId('container-content').parentElement;
    expect(container).toHaveClass('custom-container');
  });
});

describe('PageLayout', () => {
  it('renders complete page layout', () => {
    render(
      <BrowserRouter>
        <PageLayout title="Layout Test">
          <div data-testid="layout-content">Page content</div>
        </PageLayout>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Layout Test')).toBeInTheDocument();
    expect(screen.getByTestId('layout-content')).toBeInTheDocument();
    
    // Check for main element
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('renders with all props', () => {
    const actions = <button>Action</button>;
    
    render(
      <BrowserRouter>
        <PageLayout 
          title="Complete Layout"
          subtitle="With all features"
          actions={actions}
          showBackButton
          backUrl="/home"
          maxWidth="lg"
        >
          <div data-testid="layout-content">Complete content</div>
        </PageLayout>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Complete Layout')).toBeInTheDocument();
    expect(screen.getByText('With all features')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByTestId('layout-content')).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(
      <BrowserRouter>
        <PageLayout title="Semantic Test">
          <div>Content</div>
        </PageLayout>
      </BrowserRouter>
    );
    
    // Should have proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Semantic Test');
    
    // Should have main landmark
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    
    // Should have proper background - check the outermost div
    const content = screen.getByText('Content');
    const pageLayout = content.closest('[class*="min-h-screen"]');
    expect(pageLayout).toHaveClass('min-h-screen', 'bg-neutral-50');
  });
});