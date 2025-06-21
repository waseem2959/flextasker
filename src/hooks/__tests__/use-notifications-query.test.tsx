/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useClearNotifications,
  notificationKeys
} from '../use-notifications-query';

// Mock the notification service
jest.mock('../../services/ui/notification-service', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    clear: jest.fn(),
  },
}));

import { notificationService } from '../../services/ui/notification-service';
const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

// Mock data
const mockNotifications = [
  {
    id: '1',
    message: 'Test notification 1',
    type: 'info',
    read: false,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2', 
    message: 'Test notification 2',
    type: 'success',
    read: true,
    createdAt: new Date('2024-01-02'),
  },
];

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe.skip('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch notifications successfully', async () => {
    mockNotificationService.getNotifications.mockResolvedValue(mockNotifications);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockNotifications);
    expect(mockNotificationService.getNotifications).toHaveBeenCalledTimes(1);
  });

  it('should handle error when fetching notifications fails', async () => {
    const error = new Error('Failed to fetch notifications');
    mockNotificationService.getNotifications.mockRejectedValue(error);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it('should filter notifications by type when provided', async () => {
    mockNotificationService.getNotifications.mockResolvedValue(mockNotifications);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useNotifications({ type: 'info' }), 
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNotificationService.getNotifications).toHaveBeenCalledWith({ type: 'info' });
  });

  it('should filter notifications by read status when provided', async () => {
    mockNotificationService.getNotifications.mockResolvedValue(mockNotifications);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useNotifications({ read: false }), 
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNotificationService.getNotifications).toHaveBeenCalledWith({ read: false });
  });
});

describe.skip('useMarkNotificationAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark notification as read successfully', async () => {
    mockNotificationService.markAsRead.mockResolvedValue(undefined);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMarkNotificationAsRead(), { wrapper });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
  });

  it('should handle error when marking notification as read fails', async () => {
    const error = new Error('Failed to mark as read');
    mockNotificationService.markAsRead.mockRejectedValue(error);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMarkNotificationAsRead(), { wrapper });

    result.current.mutate('1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});

describe.skip('useMarkAllNotificationsAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark all notifications as read successfully', async () => {
    mockNotificationService.markAllAsRead.mockResolvedValue(undefined);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNotificationService.markAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('should handle error when marking all notifications as read fails', async () => {
    const error = new Error('Failed to mark all as read');
    mockNotificationService.markAllAsRead.mockRejectedValue(error);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});

describe.skip('useClearNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should clear notifications successfully', async () => {
    mockNotificationService.clear.mockResolvedValue(undefined);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClearNotifications(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNotificationService.clear).toHaveBeenCalledTimes(1);
  });

  it('should handle error when clearing notifications fails', async () => {
    const error = new Error('Failed to clear notifications');
    mockNotificationService.clear.mockRejectedValue(error);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useClearNotifications(), { wrapper });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});

describe.skip('notificationKeys', () => {
  it('should generate correct query keys', () => {
    expect(notificationKeys.all).toEqual(['notifications']);
    expect(notificationKeys.lists()).toEqual(['notifications', 'list']);
    expect(notificationKeys.list({ type: 'info' })).toEqual(['notifications', 'list', { type: 'info' }]);
    expect(notificationKeys.detail('1')).toEqual(['notifications', 'detail', '1']);
  });
});