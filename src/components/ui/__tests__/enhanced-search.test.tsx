/**
 * Enhanced Search Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedSearch } from '../enhanced-search';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('EnhancedSearch', () => {
  const mockOnSearch = jest.fn();
  const mockOnSuggestionSelect = jest.fn();
  
  const defaultProps = {
    onSearch: mockOnSearch,
    onSuggestionSelect: mockOnSuggestionSelect
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });
  
  describe('Basic Functionality', () => {
    it('renders with default placeholder', () => {
      render(<EnhancedSearch {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('placeholder', 'Search for tasks, services, or locations...');
    });
    
    it('renders with custom placeholder', () => {
      render(<EnhancedSearch {...defaultProps} placeholder="Custom search..." />);
      
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('placeholder', 'Custom search...');
    });
    
    it('calls onSearch with debounced value', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test query');
      
      // Wait for debounce (300ms)
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test query', {});
      }, { timeout: 400 });
    });
    
    it('shows clear button when query exists', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      // Find the clear button by looking for all buttons and selecting the one with X icon
      const buttons = await screen.findAllByRole('button');
      const clearButton = buttons.find(button => button.innerHTML.includes('lucide-x'));
      expect(clearButton).toBeInTheDocument();
      
      if (clearButton) {
        await user.click(clearButton);
      }
      expect(input).toHaveValue('');
    });
  });
  
  describe('Suggestions', () => {
    const suggestions = [
      { id: '1', text: 'Clean my house', type: 'task' as const },
      { id: '2', text: 'Fix plumbing', type: 'task' as const, category: 'Home Services' },
      { id: '3', text: 'Sydney', type: 'location' as const }
    ];
    
    it('shows suggestions when provided', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} suggestions={suggestions} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'a');
      
      expect(screen.getByText('Clean my house')).toBeInTheDocument();
      expect(screen.getByText('Fix plumbing')).toBeInTheDocument();
      expect(screen.getByText('Sydney')).toBeInTheDocument();
    });
    
    it('calls onSuggestionSelect when suggestion clicked', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} suggestions={suggestions} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'a');
      
      const suggestion = screen.getByText('Fix plumbing');
      await user.click(suggestion);
      
      expect(mockOnSuggestionSelect).toHaveBeenCalledWith(suggestions[1]);
      expect(input).toHaveValue('Fix plumbing');
    });
    
    it('shows category for suggestions with category', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} suggestions={suggestions} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'a');
      
      expect(screen.getByText('in Home Services')).toBeInTheDocument();
    });
  });
  
  describe('Keyboard Navigation', () => {
    const suggestions = [
      { id: '1', text: 'Suggestion 1', type: 'task' as const },
      { id: '2', text: 'Suggestion 2', type: 'task' as const }
    ];
    
    it('navigates suggestions with arrow keys', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} suggestions={suggestions} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      // Arrow down
      await user.keyboard('{ArrowDown}');
      const firstSuggestion = screen.getByText('Suggestion 1').closest('button');
      expect(firstSuggestion).toHaveClass('bg-neutral-100');
      
      // Arrow down again
      await user.keyboard('{ArrowDown}');
      const secondSuggestion = screen.getByText('Suggestion 2').closest('button');
      expect(secondSuggestion).toHaveClass('bg-neutral-100');
      
      // Arrow up
      await user.keyboard('{ArrowUp}');
      expect(firstSuggestion).toHaveClass('bg-neutral-100');
    });
    
    it('selects suggestion with Enter key', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} suggestions={suggestions} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      await user.keyboard('{ArrowDown}{Enter}');
      
      expect(mockOnSuggestionSelect).toHaveBeenCalledWith(suggestions[0]);
    });
    
    it('closes suggestions with Escape key', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} suggestions={suggestions} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      expect(screen.queryByText('Suggestion 1')).not.toBeInTheDocument();
    });
  });
  
  describe('Recent Searches', () => {
    it('loads recent searches from localStorage', () => {
      const recentSearches = ['recent 1', 'recent 2'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(recentSearches));
      
      render(<EnhancedSearch {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      
      expect(screen.getByText('Recent searches')).toBeInTheDocument();
      expect(screen.getByText('recent 1')).toBeInTheDocument();
      expect(screen.getByText('recent 2')).toBeInTheDocument();
    });
    
    it('adds new searches to recent searches', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'new search{Enter}');
      
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'flextasker-recent-searches',
          JSON.stringify(['new search'])
        );
      });
    });
    
    it('clears recent searches', async () => {
      const user = userEvent.setup();
      const recentSearches = ['recent 1'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(recentSearches));
      
      render(<EnhancedSearch {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      
      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('flextasker-recent-searches');
    });
  });
  
  describe('Loading State', () => {
    it('shows loading indicator when loading prop is true', async () => {
      const user = userEvent.setup();
      render(<EnhancedSearch {...defaultProps} loading={true} />);
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });
  
  describe('Voice Search', () => {
    it('shows voice search button when enabled', () => {
      render(<EnhancedSearch {...defaultProps} voiceSearchEnabled={true} />);
      
      const buttons = screen.getAllByRole('button');
      // Should have voice button
      expect(buttons.length).toBeGreaterThan(0);
    });
    
    it('does not show voice search button when disabled', () => {
      render(<EnhancedSearch {...defaultProps} voiceSearchEnabled={false} showFilters={false} />);
      
      const buttons = screen.queryAllByRole('button');
      // Should not have any buttons initially (no clear button, no voice, no filter)
      expect(buttons.length).toBe(0);
    });
  });
  
  describe('Filters', () => {
    it('shows filter button when showFilters is true', () => {
      render(<EnhancedSearch {...defaultProps} showFilters={true} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
  
  describe('Click Outside', () => {
    it('closes suggestions when clicking outside', async () => {
      const user = userEvent.setup();
      const suggestions = [{ id: '1', text: 'Test', type: 'task' as const }];
      
      render(
        <div>
          <EnhancedSearch {...defaultProps} suggestions={suggestions} />
          <div data-testid="outside">Outside element</div>
        </div>
      );
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      
      const outside = screen.getByTestId('outside');
      await user.click(outside);
      
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });
});