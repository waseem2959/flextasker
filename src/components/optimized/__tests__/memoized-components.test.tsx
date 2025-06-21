/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserRole } from '../../../../shared/types/common/enums';
import {
  MemoizedUserAvatar,
  MemoizedRoleBadge,
  MemoizedStatusBadge,
  MemoizedFormattedDate,
  MemoizedLoadingSpinner,
  MemoizedStatsCard,
  MemoizedActionButtons,
  MemoizedEmptyState
} from '../memoized-components';

describe('MemoizedUserAvatar', () => {
  it('should render user initials when no avatar provided', () => {
    render(
      <MemoizedUserAvatar
        firstName="John"
        lastName="Doe"
        size="md"
      />
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should render avatar image when provided', () => {
    render(
      <MemoizedUserAvatar
        firstName="John"
        lastName="Doe"
        avatar="https://example.com/avatar.jpg"
        size="md"
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'John Doe');
  });

  it('should apply correct size classes', () => {
    const { rerender } = render(
      <MemoizedUserAvatar
        firstName="John"
        lastName="Doe"
        size="sm"
      />
    );

    const container = screen.getByText('JD').parentElement;
    expect(container).toHaveClass('h-8', 'w-8');

    rerender(
      <MemoizedUserAvatar
        firstName="John"
        lastName="Doe"
        size="lg"
      />
    );

    const containerLg = screen.getByText('JD').parentElement;
    expect(containerLg).toHaveClass('h-16', 'w-16');
  });

  it('should handle missing names gracefully', () => {
    render(
      <MemoizedUserAvatar
        firstName=""
        lastName=""
        size="md"
      />
    );

    // Should render empty initials when no names provided
    const initialsSpan = document.querySelector('span.font-medium');
    expect(initialsSpan).toHaveTextContent('');
  });

  it('should be properly memoized with displayName', () => {
    // Check that the component has the correct displayName (indicating it's wrapped with memo)
    expect(MemoizedUserAvatar.displayName).toBe('MemoizedUserAvatar');
    
    // Check that it's actually a memoized component (React.memo returns a different component type)
    expect(MemoizedUserAvatar.$$typeof).toBeDefined();
  });
});

describe('MemoizedRoleBadge', () => {
  it('should render admin role with correct styling', () => {
    render(<MemoizedRoleBadge role={UserRole.ADMIN} />);
    
    const badge = screen.getByText('Admin');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should render tasker role with correct styling', () => {
    render(<MemoizedRoleBadge role={UserRole.TASKER} />);
    
    const badge = screen.getByText('Tasker');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should render user role with correct styling', () => {
    render(<MemoizedRoleBadge role={UserRole.USER} />);
    
    const badge = screen.getByText('User');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should handle unknown role gracefully', () => {
    render(<MemoizedRoleBadge role={'UNKNOWN' as UserRole} />);
    
    const badge = screen.getByText('Unknown');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });
});

describe('MemoizedStatusBadge', () => {
  it('should render active status correctly', () => {
    render(<MemoizedStatusBadge status="status" isActive={true} />);
    
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should render inactive status correctly', () => {
    render(<MemoizedStatusBadge status="status" isActive={false} />);
    
    const badge = screen.getByText('Inactive');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('should render different status types', () => {
    render(<MemoizedStatusBadge status="verified" isActive={true} />);
    
    const badge = screen.getByText('Verified');
    expect(badge).toBeInTheDocument();
  });
});

describe('MemoizedFormattedDate', () => {
  it('should format date correctly', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');
    render(<MemoizedFormattedDate date={testDate} />);
    
    // Should show formatted date (exact format may vary based on locale)
    expect(screen.getByText(/Jan|January/)).toBeInTheDocument();
  });

  it('should handle relative formatting', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');
    render(<MemoizedFormattedDate date={testDate} format="relative" />);
    
    // Should show relative time
    expect(screen.getByText(/ago|in/)).toBeInTheDocument();
  });

  it('should handle string dates', () => {
    render(<MemoizedFormattedDate date="2024-01-15T10:30:00Z" />);
    
    expect(screen.getByText(/Jan|January/)).toBeInTheDocument();
  });

  it('should handle invalid dates gracefully', () => {
    render(<MemoizedFormattedDate date="invalid-date" />);
    
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });
});

describe('MemoizedLoadingSpinner', () => {
  it('should render with default props', () => {
    render(<MemoizedLoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should render with custom text', () => {
    render(<MemoizedLoadingSpinner text="Loading users..." />);
    
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('should apply different sizes', () => {
    const { rerender } = render(<MemoizedLoadingSpinner size="sm" />);
    
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4');

    rerender(<MemoizedLoadingSpinner size="lg" />);
    
    expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12');
  });

  it('should apply custom className', () => {
    render(<MemoizedLoadingSpinner className="custom-class" />);
    
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });
});

describe('MemoizedStatsCard', () => {
  it('should render stats card with title and value', () => {
    render(
      <MemoizedStatsCard
        title="Total Users"
        value={150}
        icon={<span data-testid="icon">👥</span>}
      />
    );
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should handle large numbers correctly', () => {
    render(
      <MemoizedStatsCard
        title="Revenue"
        value={1234567}
      />
    );
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should render without icon', () => {
    render(
      <MemoizedStatsCard
        title="Tasks"
        value={42}
      />
    );
    
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});

describe('MemoizedActionButtons', () => {
  it('should render multiple action buttons', () => {
    const mockActions = [
      { label: 'Edit', onClick: jest.fn() },
      { label: 'Delete', onClick: jest.fn(), variant: 'destructive' as const },
      { label: 'View', onClick: jest.fn(), variant: 'outline' as const }
    ];

    render(<MemoizedActionButtons actions={mockActions} />);
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('should call onClick handlers when buttons are clicked', () => {
    const mockOnClick = jest.fn();
    const mockActions = [
      { label: 'Test Action', onClick: mockOnClick }
    ];

    render(<MemoizedActionButtons actions={mockActions} />);
    
    fireEvent.click(screen.getByText('Test Action'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when specified', () => {
    const mockActions = [
      { label: 'Disabled Action', onClick: jest.fn(), disabled: true }
    ];

    render(<MemoizedActionButtons actions={mockActions} />);
    
    const button = screen.getByText('Disabled Action');
    expect(button).toBeDisabled();
  });

  it('should apply different button variants', () => {
    const mockActions = [
      { label: 'Default', onClick: jest.fn() },
      { label: 'Destructive', onClick: jest.fn(), variant: 'destructive' as const },
      { label: 'Outline', onClick: jest.fn(), variant: 'outline' as const }
    ];

    render(<MemoizedActionButtons actions={mockActions} />);
    
    // Check that buttons are rendered (specific styling classes would depend on your Button component implementation)
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Destructive')).toBeInTheDocument();
    expect(screen.getByText('Outline')).toBeInTheDocument();
  });
});

describe('MemoizedEmptyState', () => {
  it('should render empty state with title and description', () => {
    render(
      <MemoizedEmptyState
        title="No data found"
        description="There are no items to display"
        icon={<span data-testid="empty-icon">📭</span>}
      />
    );
    
    expect(screen.getByText('No data found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('should render with action button', () => {
    const mockAction = jest.fn();
    render(
      <MemoizedEmptyState
        title="No tasks"
        description="Create your first task"
        action={
          <button onClick={mockAction}>Create Task</button>
        }
      />
    );
    
    const actionButton = screen.getByText('Create Task');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    render(
      <MemoizedEmptyState
        title="Empty"
        description="Nothing here"
        className="custom-empty-state"
      />
    );
    
    expect(screen.getByText('Empty').closest('div')).toHaveClass('custom-empty-state');
  });

  it('should render without optional props', () => {
    render(
      <MemoizedEmptyState
        title="Empty"
        description="Nothing here"
      />
    );
    
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});