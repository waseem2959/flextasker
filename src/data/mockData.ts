import { User, Task, Category, Bid, TaskStatus, UserRole, BudgetType, TaskPriority, BidStatus, UserImpl } from '../types';

// Mock Categories
export const CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Home Services',
    icon: 'home',
    subcategories: ['Cleaning', 'Plumbing', 'Electrical', 'Painting', 'Carpentry', 'Furniture Assembly']
  },
  {
    id: 'cat-2',
    name: 'Professional',
    icon: 'briefcase',
    subcategories: ['Web Development', 'Design', 'Content Writing', 'Translation', 'Accounting', 'Legal']
  },
  {
    id: 'cat-3',
    name: 'Personal',
    icon: 'user',
    subcategories: ['Tutoring', 'Fitness Training', 'Cooking', 'Pet Care', 'Personal Shopping']
  },
  {
    id: 'cat-4',
    name: 'Errands',
    icon: 'clock',
    subcategories: ['Delivery', 'Shopping', 'Waiting in Line', 'Package Pickup']
  },
  {
    id: 'cat-5',
    name: 'Events',
    icon: 'camera',
    subcategories: ['Photography', 'Videography', 'DJ Services', 'Catering', 'Event Planning']
  }
];

export const USERS: User[] = [
  new UserImpl({
    id: 'user-1',
    firstName: 'Samudragupta',
    lastName: 'Barma',
    email: 'samudragupta@example.com',
    phone: '+91 8134855675',
    role: UserRole.TASKER,
    avatar: 'https://cdn-icons-png.flaticon.com/128/1999/1999625.png',
    averageRating: 4.8,
    totalReviews: 15,
    createdAt: new Date('2023-09-15T10:30:00.000Z'),
    bio: 'Expert plumber with 8 years of experience in residential and commercial projects',
    trustScore: 95,
    emailVerified: true,
    phoneVerified: true,
    city: 'Nalbari',
    state: 'Assam',
    country: 'India'
  }),
  new UserImpl({
    id: 'user-2',
    firstName: 'Aashi',
    lastName: '',
    email: 'aashi@example.com',
    phone: '+91 9876543211',
    role: UserRole.TASKER,
    avatar: 'https://cdn-icons-png.flaticon.com/128/6997/6997662.png',
    averageRating: 4.9,
    totalReviews: 27,
    createdAt: new Date('2023-08-20T15:45:00.000Z'),
    bio: 'Professional carpenter from Sonipat specializing in custom furniture and home renovations',
    trustScore: 90,
    emailVerified: true,
    phoneVerified: true,
    city: 'Sonipat',
    state: 'Haryana',
    country: 'India'
  }),
  new UserImpl({
    id: 'user-3',
    firstName: 'Shreshta',
    lastName: '',
    email: 'shreshta@example.com',
    phone: '+91 9876543212',
    role: UserRole.TASKER,
    avatar: 'https://cdn-icons-png.flaticon.com/128/4140/4140047.png',
    averageRating: 4.7,
    totalReviews: 32,
    createdAt: new Date('2023-07-10T09:20:00.000Z'),
    bio: 'Professional painter based in Delhi with expertise in interior and exterior painting',
    trustScore: 88,
    emailVerified: true,
    phoneVerified: true,
    city: 'Delhi',
    state: '',
    country: 'India'
  }),
  new UserImpl({
    id: 'user-4',
    firstName: 'Pawan',
    lastName: 'Kumar',
    email: 'pawan@example.com',
    phone: '+91 9876543213',
    role: UserRole.USER,
    avatar: 'https://cdn-icons-png.flaticon.com/128/2202/2202112.png',
    averageRating: 4.6,
    totalReviews: 8,
    createdAt: new Date('2023-10-05T14:15:00.000Z'),
    bio: 'Business owner from Nalanda looking for skilled professionals for various projects',
    trustScore: 85,
    emailVerified: true,
    phoneVerified: true,
    city: 'Nalanda',
    state: 'Bihar',
    country: 'India'
  }),
  new UserImpl({
    id: 'user-5',
    firstName: 'Admin',
    lastName: '',
    email: 'admin@flextasker.com',
    role: UserRole.ADMIN,
    avatar: '',
    averageRating: 5.0,
    totalReviews: 0,
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    trustScore: 100,
    emailVerified: true,
    phoneVerified: true
  })
];

export const TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Bathroom Plumbing Repair',
    description: 'Need to fix a leaking sink and replace the shower head in my bathroom.',
    category: {
      id: 'cat-1',
      name: 'Home Services'
    },
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.MEDIUM,
    budget: 3000,
    budgetType: BudgetType.FIXED,
    isRemote: false,
    location: 'Connaught Place, Delhi, India',
    tags: ['Plumbing', 'Bathroom', 'Repair'],
    requirements: ['Tools', 'Experience with plumbing'],
    createdAt: new Date('2023-11-10T09:30:00.000Z'),
    deadline: new Date('2023-11-15T18:00:00.000Z'),
    owner: USERS[3], // Pawan Kumar
    assignee: USERS[0], // Samudragupta
    bidCount: 2
  },
  {
    id: 'task-2',
    title: 'Living Room Painting',
    description: 'Need to paint my living room with premium quality paint.',
    category: {
      id: 'cat-1',
      name: 'Home Services'
    },
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    budget: 10000,
    budgetType: BudgetType.FIXED,
    isRemote: false,
    location: 'Nalanda, Bihar',
    tags: ['Painting', 'Interior', 'Living Room'],
    requirements: ['Premium paint', 'Experience with interior painting'],
    createdAt: new Date('2023-11-12T14:45:00.000Z'),
    deadline: new Date('2023-11-18T18:00:00.000Z'),
    owner: USERS[3], // Pawan Kumar
    assignee: USERS[2], // Shreshta
    bidCount: 1
  },
  {
    id: 'task-3',
    title: 'Website Development for Small Business',
    description: 'Looking for a web developer to create a responsive website for my small retail business. Need help with social media, content marketing, and SEO optimization. Budget is negotiable for the right candidate.',
    category: {
      id: 'cat-2',
      name: 'Professional'
    },
    status: TaskStatus.OPEN,
    priority: TaskPriority.MEDIUM,
    budget: 20000,
    budgetType: BudgetType.FIXED,
    isRemote: true,
    location: 'Remote',
    tags: ['Web Development', 'Small Business', 'Responsive Design'],
    requirements: ['Portfolio of previous work', 'Knowledge of modern web technologies'],
    createdAt: new Date('2023-11-15T10:20:00.000Z'),
    deadline: new Date('2023-12-05T23:59:00.000Z'),
    owner: USERS[3], // Pawan Kumar
    bidCount: 0
  },
  {
    id: 'task-4',
    title: 'Custom Bookshelf Building',
    description: 'Looking for a carpenter to build a custom bookshelf for my home office. Need it to be 6ft tall and 4ft wide with adjustable shelves.',
    category: {
      id: 'cat-1',
      name: 'Home Services'
    },
    status: TaskStatus.OPEN,
    priority: TaskPriority.LOW,
    budget: 6500,
    budgetType: BudgetType.FIXED,
    isRemote: false,
    location: 'Nalanda, Bihar',
    tags: ['Carpentry', 'Furniture', 'Bookshelf'],
    requirements: ['Materials provided', 'Experience with custom furniture'],
    createdAt: new Date('2023-11-14T09:15:00.000Z'),
    deadline: new Date('2023-11-24T18:00:00.000Z'),
    owner: USERS[3], // Pawan Kumar
    bidCount: 0
  },
  {
    id: 'task-5',
    title: 'Digital Marketing Strategy',
    description: 'Looking for a digital marketing expert to create a 3-month strategy for my online business. Need help with social media, content marketing, and SEO optimization. Budget is negotiable for the right candidate.',
    category: {
      id: 'cat-2',
      name: 'Professional'
    },
    status: TaskStatus.OPEN,
    priority: TaskPriority.HIGH,
    budget: 15000,
    budgetType: BudgetType.NEGOTIABLE,
    isRemote: true,
    location: 'Remote',
    tags: ['Digital Marketing', 'SEO', 'Social Media'],
    requirements: ['Previous experience', 'Portfolio of successful campaigns'],
    createdAt: new Date('2023-11-07T16:35:00.000Z'),
    deadline: undefined,
    owner: USERS[3], // Pawan Kumar
    bidCount: 0
  }
];

// Get a task with its client populated
export function getTaskWithClient(taskId: string) {
  const task = TASKS.find(t => t.id === taskId);
  if (!task) return null;
  
  return task; // Owner is already populated in the task
};

// Get bids for a task with bidders populated
export function getTaskBids(taskId: string): Bid[] {
  // In a real application, this would fetch bids from an API
  // For this mock, we'll return static data
  
  // Find all bids for this task (hardcoded for now)
  const allBids: Bid[] = [];
  
  // Only task-1 has bids in our mock data
  if (taskId === 'task-1') {
    allBids.push({
      id: 'bid-1',
      taskId: 'task-1',
      bidderId: 'user-1',
      amount: 2800,
      description: 'I can fix this in 2 hours. Have all necessary tools and replacement parts.',
      timeline: '1 day',
      status: BidStatus.ACCEPTED,
      submittedAt: new Date('2023-11-11T10:15:00.000Z'),
      task: TASKS[0],
      bidder: USERS[0]
    });
    
    allBids.push({
      id: 'bid-2',
      taskId: 'task-1',
      bidderId: 'user-2',
      amount: 3000,
      description: 'Available tomorrow with all required tools.',
      timeline: '2 days',
      status: BidStatus.REJECTED,
      submittedAt: new Date('2023-11-11T11:20:00.000Z'),
      task: TASKS[0],
      bidder: USERS[1]
    });
  }
  
  return allBids;
};

// Get filtered tasks
export function getFilteredTasks(filters: {
  category?: string;
  search?: string;
  status?: TaskStatus;
}) {
  let filteredTasks = [...TASKS];
  
  // Filter by category
  if (filters.category) {
    filteredTasks = filteredTasks.filter(task => 
      task.category.name === filters.category
    );
  }
  
  // Filter by search term
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // Filter by status
  if (filters.status) {
    filteredTasks = filteredTasks.filter(task => task.status === filters.status);
  }
  
  return filteredTasks;
}

// Generate a new bid for a task
export function createBid(taskId: string, workerId: string, amount: number, message?: string): Bid {
  const task = TASKS.find(t => t.id === taskId);
  const bidder = USERS.find(u => u.id === workerId);
  
  if (!task || !bidder) {
    throw new Error('Invalid task or bidder ID');
  }
  
  const newBid: Bid = {
    id: `bid-${Date.now()}`,
    taskId,
    bidderId: workerId,
    amount,
    description: message ?? `I'm interested in completing this task for $${amount}.`,
    timeline: '3 days', // Default timeline
    status: BidStatus.PENDING,
    submittedAt: new Date(),
    task,
    bidder
  };
  
  return newBid;
}
