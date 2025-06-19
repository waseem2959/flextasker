/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import {
  useDebounce,
  useDebouncedCallback,
  DebouncedSearchInput,
  DebouncedTextInput,
  DebouncedTextarea
} from '../debounced-inputs';

// Mock timers for testing debounce functionality
jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Should still be initial

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // First update
    rerender({ value: 'update1', delay: 500 });
    
    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Second update before debounce completes
    rerender({ value: 'update2', delay: 500 });
    
    // Advance time partially again
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe('initial'); // Should still be initial

    // Complete the debounce
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe('update2');
  });
});

describe('useDebouncedCallback', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should debounce callback execution', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500));

    // Call the debounced function multiple times
    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    expect(mockCallback).not.toHaveBeenCalled();

    // Advance time to trigger callback
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith('arg3');
  });

  it('should update callback reference when callback changes', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, 500),
      { initialProps: { callback: mockCallback1 } }
    );

    // Update callback
    rerender({ callback: mockCallback2 });

    act(() => {
      result.current('test');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback1).not.toHaveBeenCalled();
    expect(mockCallback2).toHaveBeenCalledWith('test');
  });

  it('should cancel previous timeout when called again', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(mockCallback, 500));

    act(() => {
      result.current('first');
    });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    act(() => {
      result.current('second');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('second');
  });
});

describe('DebouncedSearchInput', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should render search input with correct attributes', () => {
    const mockOnSearch = jest.fn();
    
    render(
      <DebouncedSearchInput
        value=""
        onSearch={mockOnSearch}
        placeholder="Search..."
        delay={300}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'search');
  });

  it('should debounce search calls', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockOnSearch = jest.fn();
    
    render(
      <DebouncedSearchInput
        value=""
        onSearch={mockOnSearch}
        placeholder="Search..."
        delay={300}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    
    await user.type(input, 'test query');

    expect(mockOnSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('should show loading state when specified', () => {
    const mockOnSearch = jest.fn();
    
    render(
      <DebouncedSearchInput
        value="test"
        onSearch={mockOnSearch}
        loading={true}
        delay={300}
      />
    );

    expect(screen.getByTestId('search-loading')).toBeInTheDocument();
  });

  it('should show clear button when value is present', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockOnSearch = jest.fn();
    const mockOnClear = jest.fn();
    
    render(
      <DebouncedSearchInput
        value="test"
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        delay={300}
      />
    );

    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should handle keyboard events correctly', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockOnSearch = jest.fn();
    
    render(
      <DebouncedSearchInput
        value=""
        onSearch={mockOnSearch}
        delay={300}
      />
    );

    const input = screen.getByRole('searchbox');
    
    await user.type(input, 'test');
    await user.keyboard('{Enter}');

    // Enter should trigger immediate search
    expect(mockOnSearch).toHaveBeenCalledWith('test');
  });
});

describe('DebouncedTextInput', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should render text input with correct props', () => {
    const mockOnChange = jest.fn();
    
    render(
      <DebouncedTextInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter text..."
        delay={300}
      />
    );

    const input = screen.getByPlaceholderText('Enter text...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should debounce onChange calls', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockOnChange = jest.fn();
    
    render(
      <DebouncedTextInput
        value=""
        onChange={mockOnChange}
        delay={300}
      />
    );

    const input = screen.getByRole('textbox');
    
    await user.type(input, 'hello');

    expect(mockOnChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockOnChange).toHaveBeenCalledWith('hello');
  });

  it('should update internal state immediately for better UX', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockOnChange = jest.fn();
    
    render(
      <DebouncedTextInput
        value=""
        onChange={mockOnChange}
        delay={300}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    await user.type(input, 'test');

    // Input should show the typed value immediately
    expect(input.value).toBe('test');
  });

  it('should handle controlled updates', () => {
    const mockOnChange = jest.fn();
    
    const { rerender } = render(
      <DebouncedTextInput
        value="initial"
        onChange={mockOnChange}
        delay={300}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('initial');

    rerender(
      <DebouncedTextInput
        value="updated"
        onChange={mockOnChange}
        delay={300}
      />
    );

    expect(input.value).toBe('updated');
  });
});

describe('DebouncedTextarea', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should render textarea with correct props', () => {
    const mockOnChange = jest.fn();
    
    render(
      <DebouncedTextarea
        value=""
        onChange={mockOnChange}
        placeholder="Enter description..."
        delay={300}
      />
    );

    const textarea = screen.getByPlaceholderText('Enter description...');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('should debounce onChange calls for textarea', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockOnChange = jest.fn();
    
    render(
      <DebouncedTextarea
        value=""
        onChange={mockOnChange}
        delay={300}
      />
    );

    const textarea = screen.getByRole('textbox');
    
    await user.type(textarea, 'This is a long description that should be debounced.');

    expect(mockOnChange).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockOnChange).toHaveBeenCalledWith('This is a long description that should be debounced.');
  });

  it('should handle multiline text correctly', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockOnChange = jest.fn();
    
    render(
      <DebouncedTextarea
        value=""
        onChange={mockOnChange}
        delay={300}
      />
    );

    const textarea = screen.getByRole('textbox');
    
    await user.type(textarea, 'Line 1{enter}Line 2{enter}Line 3');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockOnChange).toHaveBeenCalledWith('Line 1\nLine 2\nLine 3');
  });

  it('should apply custom className and other props', () => {
    const mockOnChange = jest.fn();
    
    render(
      <DebouncedTextarea
        value=""
        onChange={mockOnChange}
        delay={300}
        className="custom-textarea"
        rows={5}
        data-testid="custom-textarea"
      />
    );

    const textarea = screen.getByTestId('custom-textarea');
    expect(textarea).toHaveClass('custom-textarea');
    expect(textarea).toHaveAttribute('rows', '5');
  });
});