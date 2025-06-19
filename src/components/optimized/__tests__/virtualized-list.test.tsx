/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  VirtualizedList,
  VirtualizedTable,
  withVirtualization
} from '../virtualized-list';

// Mock the lazy-loading hook
jest.mock('../../../utils/lazy-loading', () => ({
  useVirtualScrolling: jest.fn()
}));

const mockUseVirtualScrolling = require('../../../utils/lazy-loading').useVirtualScrolling;

// Sample data for testing
const sampleItems = Array.from({ length: 1000 }, (_, index) => ({
  id: index,
  name: `Item ${index}`,
  value: index * 10
}));

const mockVisibleItems = [
  { item: sampleItems[0], index: 0 },
  { item: sampleItems[1], index: 1 },
  { item: sampleItems[2], index: 2 }
];

describe('VirtualizedList', () => {
  beforeEach(() => {
    mockUseVirtualScrolling.mockReturnValue({
      visibleItems: mockVisibleItems,
      totalHeight: 50000, // 1000 items * 50px
      offsetY: 0,
      handleScroll: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render virtualized list with visible items', () => {
    const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;

    render(
      <VirtualizedList
        items={sampleItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
      />
    );

    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should call useVirtualScrolling with correct parameters', () => {
    const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;

    render(
      <VirtualizedList
        items={sampleItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
        overscan={10}
      />
    );

    expect(mockUseVirtualScrolling).toHaveBeenCalledWith(sampleItems, {
      itemHeight: 50,
      containerHeight: 400,
      overscan: 10
    });
  });

  it('should handle scroll events correctly', async () => {
    const user = userEvent.setup();
    const mockHandleScroll = jest.fn();
    const mockOnScroll = jest.fn();

    mockUseVirtualScrolling.mockReturnValue({
      visibleItems: mockVisibleItems,
      totalHeight: 50000,
      offsetY: 0,
      handleScroll: mockHandleScroll
    });

    const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;

    render(
      <VirtualizedList
        items={sampleItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
        onScroll={mockOnScroll}
      />
    );

    const container = screen.getByTestId('virtualized-container');
    
    fireEvent.scroll(container, { target: { scrollTop: 100 } });

    expect(mockHandleScroll).toHaveBeenCalled();
    expect(mockOnScroll).toHaveBeenCalledWith(100);
  });

  it('should render loading component when loading', () => {
    const LoadingComponent = () => <div>Loading...</div>;
    const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;

    render(
      <VirtualizedList
        items={sampleItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
        loading={true}
        loadingComponent={LoadingComponent}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render empty component when no items', () => {
    const EmptyComponent = () => <div>No items found</div>;
    const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;

    render(
      <VirtualizedList
        items={[]}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
        emptyComponent={EmptyComponent}
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('should use custom getItemKey function', () => {
    const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;
    const getItemKey = (item: any, index: number) => `custom-${item.id}-${index}`;

    render(
      <VirtualizedList
        items={sampleItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
        getItemKey={getItemKey}
      />
    );

    // The custom key function should be used (tested indirectly through React's key prop)
    expect(screen.getByText('Item 0')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;

    const { container } = render(
      <VirtualizedList
        items={sampleItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
        className="custom-virtualized-list"
      />
    );

    expect(container.firstChild).toHaveClass('custom-virtualized-list');
  });

  it('should position items correctly with transform', () => {
    const renderItem = (item: any, index: number) => (
      <div data-testid={`item-${index}`}>{item.name}</div>
    );

    render(
      <VirtualizedList
        items={sampleItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={renderItem}
      />
    );

    const firstItem = screen.getByTestId('item-0').parentElement;
    expect(firstItem).toHaveStyle({
      height: '50px',
      transform: 'translateY(0px)',
      position: 'absolute'
    });
  });
});

describe('VirtualizedTable', () => {
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: any) => item.name,
      width: '200px'
    },
    {
      key: 'value',
      header: 'Value',
      render: (item: any) => item.value,
      width: '100px'
    }
  ];

  beforeEach(() => {
    mockUseVirtualScrolling.mockReturnValue({
      visibleItems: mockVisibleItems,
      totalHeight: 50000,
      offsetY: 0,
      handleScroll: jest.fn()
    });
  });

  it('should render table with headers and virtualized rows', () => {
    render(
      <VirtualizedTable
        items={sampleItems}
        columns={columns}
        rowHeight={50}
        containerHeight={400}
      />
    );

    // Check headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();

    // Check data rows
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle row click events', async () => {
    const user = userEvent.setup();
    const mockOnRowClick = jest.fn();

    render(
      <VirtualizedTable
        items={sampleItems}
        columns={columns}
        rowHeight={50}
        containerHeight={400}
        onRowClick={mockOnRowClick}
      />
    );

    const firstRow = screen.getByText('Item 0').closest('div');
    await user.click(firstRow!);

    expect(mockOnRowClick).toHaveBeenCalledWith(sampleItems[0], 0);
  });

  it('should apply custom row className', () => {
    const rowClassName = (item: any, index: number) => 
      index % 2 === 0 ? 'even-row' : 'odd-row';

    render(
      <VirtualizedTable
        items={sampleItems}
        columns={columns}
        rowHeight={50}
        containerHeight={400}
        rowClassName={rowClassName}
      />
    );

    const firstRow = screen.getByText('Item 0').closest('div');
    expect(firstRow).toHaveClass('even-row');
  });

  it('should render loading state', () => {
    render(
      <VirtualizedTable
        items={sampleItems}
        columns={columns}
        rowHeight={50}
        containerHeight={400}
        loading={true}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(
      <VirtualizedTable
        items={[]}
        columns={columns}
        rowHeight={50}
        containerHeight={400}
        emptyMessage="No data available"
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should calculate column widths correctly', () => {
    const columnsWithoutWidth = [
      {
        key: 'name',
        header: 'Name',
        render: (item: any) => item.name
      },
      {
        key: 'value',
        header: 'Value', 
        render: (item: any) => item.value
      }
    ];

    render(
      <VirtualizedTable
        items={sampleItems}
        columns={columnsWithoutWidth}
        rowHeight={50}
        containerHeight={400}
      />
    );

    // Each column should get equal width (50% each)
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header).toHaveStyle({ width: '50%' });
    });
  });

  it('should apply custom className to table', () => {
    const { container } = render(
      <VirtualizedTable
        items={sampleItems}
        columns={columns}
        rowHeight={50}
        containerHeight={400}
        className="custom-table"
      />
    );

    expect(container.firstChild).toHaveClass('custom-table');
  });

  it('should apply header className', () => {
    render(
      <VirtualizedTable
        items={sampleItems}
        columns={columns}
        rowHeight={50}
        containerHeight={400}
        headerClassName="custom-header"
      />
    );

    const header = screen.getByText('Name').closest('div');
    expect(header).toHaveClass('custom-header');
  });
});

describe('withVirtualization', () => {
  const TestComponent = ({ items }: { items: any[] }) => (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );

  beforeEach(() => {
    mockUseVirtualScrolling.mockReturnValue({
      visibleItems: mockVisibleItems,
      totalHeight: 50000,
      offsetY: 0,
      handleScroll: jest.fn()
    });
  });

  it('should create virtualized version of component', () => {
    const VirtualizedComponent = withVirtualization(TestComponent, {
      itemHeight: 50,
      containerHeight: 400,
      overscan: 5
    });

    render(<VirtualizedComponent items={sampleItems} />);

    expect(screen.getByText('Item 0')).toBeInTheDocument();
  });

  it('should pass through other props to wrapped component', () => {
    const TestComponentWithProps = ({ 
      items, 
      title 
    }: { 
      items: any[]; 
      title: string; 
    }) => (
      <div>
        <h2>{title}</h2>
        {items.map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    );

    const VirtualizedComponent = withVirtualization(TestComponentWithProps, {
      itemHeight: 50,
      containerHeight: 400
    });

    render(<VirtualizedComponent items={sampleItems} title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should memoize the virtualized component', () => {
    const renderSpy = jest.spyOn(React, 'memo');
    
    withVirtualization(TestComponent, {
      itemHeight: 50,
      containerHeight: 400
    });

    expect(renderSpy).toHaveBeenCalled();
  });
});