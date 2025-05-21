import { render } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { useAuth } from '../../hooks/useAuth';
import { USERS, TASKS } from '../../data/mockData';
import { User, Task } from '../../types'; // Import User and Task types

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the sub-components used in Dashboard to isolate filtering logic
jest.mock('../../components/dashboard/DashboardStats', () => ({
  DashboardStats: () => <div data-testid="dashboard-stats"></div>,
}));
jest.mock('../../components/dashboard/RecentActivity', () => ({
  RecentActivity: () => <div data-testid="recent-activity"></div>,
}));
jest.mock('../../components/dashboard/QuickLinks', () => ({
  QuickLinks: () => <div data-testid="quick-links"></div>,
}));
jest.mock('../../components/dashboard/TasksAndBidsList', () => ({
  TasksAndBidsList: ({ user, myTasks }: { user: User; myTasks: Task[] }) => ( // Use imported types
    <div data-testid="tasks-and-bids-list">
      <h2>Tasks/Bids List</h2>
      <div data-testid="user-role">{user.role}</div>
      <div data-testid="task-count">{myTasks.length}</div>
      {myTasks.map(task => <div key={task.id} data-testid="task-item">{task.title}</div>)}
    </div>
  ) // Removed extra comma here
}));
jest.mock('../../components/dashboard/ProfileSection', () => ({
  ProfileSection: () => <div data-testid="profile-section"></div>,
}));
jest.mock('../../components/dashboard/MessagesSection', () => ({
  MessagesSection: () => <div data-testid="messages-section"></div>,
}));

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));


describe('Dashboard Task Filtering', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (useAuth as jest.Mock).mockReset();
    mockNavigate.mockReset();
  });

  test('should filter tasks correctly for a client user', () => {
    const clientUser = USERS.find(user => user.role === 'client');
    (useAuth as jest.Mock).mockReturnValue({
      user: clientUser,
      isAuthenticated: true,
      loading: false,
    });

    const { getByTestId, getByText } = render( // Destructure query methods
      <Router>
        <Dashboard />
      </Router>
    );

    // Expect TasksAndBidsList to receive tasks where clientId matches clientUser.id
    const tasksAndBidsList = getByTestId('tasks-and-bids-list'); // Use getByTestId from render result
    const taskCount = getByTestId(tasksAndBidsList, 'task-count'); // Use getByTestId with container
    // const taskItems = within(tasksAndBidsList).getAllByTestId('task-item'); // This line is not needed for the assertions below

    const expectedClientTasks = TASKS.filter(task => task.clientId === clientUser?.id);

    expect(taskCount).toHaveTextContent(expectedClientTasks.length.toString());
    expectedClientTasks.forEach(task => {
      expect(getByText(tasksAndBidsList, task.title)).toBeInTheDocument(); // Use getByText with container
    });
  });

  test('should filter tasks correctly for a worker user', () => {
    const workerUser = USERS.find(user => user.role === 'worker');
    (useAuth as jest.Mock).mockReturnValue({
      user: workerUser,
      isAuthenticated: true,
      loading: false,
    });

    const { getByTestId, getByText } = render( // Destructure query methods
      <Router>
        <Dashboard />
      </Router>
    );

    // Expect TasksAndBidsList to receive tasks where worker has a bid
    const tasksAndBidsList = getByTestId('tasks-and-bids-list'); // Use getByTestId from render result
    const taskCount = getByTestId(tasksAndBidsList, 'task-count'); // Use getByTestId with container
    // const taskItems = within(tasksAndBidsList).getAllByTestId('task-item'); // This line is not needed for the assertions below


    const expectedWorkerTasks = TASKS.filter(task => task.bids.some(bid => bid.workerId === workerUser?.id));

    expect(taskCount).toHaveTextContent(expectedWorkerTasks.length.toString());
     expectedWorkerTasks.forEach(task => {
       expect(getByText(tasksAndBidsList, task.title)).toBeInTheDocument(); // Use getByText with container
     });
  });

  test('should redirect to login if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
    });

    render(
      <Router>
        <Dashboard />
      </Router>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});