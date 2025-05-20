import { User, Task, Category, Bid } from '../types';

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
  {
    id: 'user-1',
    name: 'Samudragupta Barma',
    email: 'samudragupta@example.com',
    phone: '+91 8134855675',
    role: 'worker',
    avatar: 'https://cdn-icons-png.flaticon.com/128/1999/1999625.png',
    rating: 4.8,
    totalReviews: 15,
    createdAt: '2023-09-15T10:30:00.000Z',
    bio: 'Expert plumber with 8 years of experience in residential and commercial projects',
    verified: true,
    skills: ['Plumbing', 'Pipe Fitting', 'Bathroom Installation'],
    location: {
      lat: 26.1445,
      lng: 91.7362,
      address: 'Nalbari, Assam'
    }
  },
  {
    id: 'user-2',
    name: 'Aashi',
    email: 'aashi@example.com',
    phone: '+91 9876543211',
    role: 'worker',
    avatar: 'https://cdn-icons-png.flaticon.com/128/6997/6997662.png',
    rating: 4.9,
    totalReviews: 27,
    createdAt: '2023-08-20T15:45:00.000Z',
    bio: 'Professional carpenter from Sonipat specializing in custom furniture and home renovations',
    skills: ['Carpentry', 'Furniture Assembly', 'Wood Work'],
    verified: true,
    location: {
      lat: 29.0588,
      lng: 76.0856,
      address: 'Sonipat, Haryana'
    }
  },
  {
    id: 'user-3',
    name: 'Shreshta',
    email: 'shreshta@example.com',
    phone: '+91 9876543212',
    role: 'worker',
    avatar: 'https://cdn-icons-png.flaticon.com/128/4140/4140047.png',
    rating: 4.7,
    totalReviews: 32,
    createdAt: '2023-07-10T09:20:00.000Z',
    bio: 'Professional painter based in Delhi with expertise in interior and exterior painting',
    skills: ['Painting', 'Wall Design', 'Texture Work'],
    verified: true,
    location: {
      lat: 28.7041,
      lng: 77.1025,
      address: 'Delhi, India'
    }
  },
  {
    id: 'user-4',
    name: 'Pawan Kumar',
    email: 'pawan@example.com',
    phone: '+91 9876543213',
    role: 'client',
    avatar: 'https://cdn-icons-png.flaticon.com/128/2202/2202112.png',
    rating: 4.6,
    totalReviews: 8,
    createdAt: '2023-10-05T14:15:00.000Z',
    bio: 'Business owner from Nalanda looking for skilled professionals for various projects',
    verified: true,
    location: {
      lat: 25.1304,
      lng: 85.4594,
      address: 'Nalanda, Bihar'
    }
  },
  {
    id: 'user-5',
    name: 'Admin',
    email: 'admin@flextasker.com',
    role: 'admin',
    avatar: '',
    rating: 5.0,
    totalReviews: 0,
    createdAt: '2023-01-01T00:00:00.000Z',
    verified: true
  }
];

export const TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Bathroom Plumbing Repair',
    description: 'Need to fix a leaking sink and replace the shower head in my bathroom.',
    category: 'Home Services',
    subcategory: 'Plumbing',
    clientId: 'user-4', // Pawan Kumar
    status: 'completed',
    budget: {
      min: 2000,
      max: 3500
    },
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Connaught Place, Delhi, India'
    },
    images: [
      'https://lh5.googleusercontent.com/proxy/4UsSZ9I1KQgjAZaCPAaSamJFFRuhsydFRYLHtYxPzUte1RipeldJ_q1_5AJFTRPfGHsm29XLrqVt2B3C5MOtR2ALdnRJ-hjdfnLGnqdjCUlsK7AeLk-ZR1bG2qvDmcrKSrX19xb1GOcMx054vSco6cn4o7mC2iA',
      'https://img.staticmb.com/mbcontent/images/crop/uploads/2023/2/Bathroom-plumbing-system_0_1200.jpg'
    ],
    createdAt: '2023-11-10T09:30:00.000Z',
    deadline: '2023-11-15T18:00:00.000Z',
    bids: [
      {
        id: 'bid-1',
        taskId: 'task-1',
        workerId: 'user-1', // Samudragupta
        amount: 2800,
        message: 'I can fix this in 2 hours. Have all necessary tools and replacement parts.',
        status: 'accepted',
        createdAt: '2023-11-11T10:15:00.000Z'
      },
      {
        id: 'bid-2',
        taskId: 'task-1',
        workerId: 'user-2', // Aashi
        amount: 3000,
        message: 'Available tomorrow with all required tools.',
        status: 'rejected',
        createdAt: '2023-11-11T11:20:00.000Z'
      }
    ]
  },
  {
    id: 'task-2',
    title: 'Living Room Painting',
    description: 'Need to paint my living room with premium quality paint.',
    category: 'Home Services',
    subcategory: 'Painting',
    clientId: 'user-4', // Pawan Kumar
    status: 'in-progress',
    budget: {
      min: 8000,
      max: 12000
    },
    location: {
      lat: 28.4595,
      lng: 77.0266,
      address: 'Nalanda, Bihar'
    },
    images: [
      'https://img.staticmb.com/mbcontent/images/uploads/2023/2/wall-paint-color-ideas-for-home.jpg',
      'https://images.livspace-cdn.com/w:3840/plain/https://d3gq2merok8n5r.cloudfront.net/abhinav/ond-1634120396-Obfdc/jas-2024-1720241010-wAOzD/category-units-1720241275-Jc6G0/wp15-1-1720606901-nqVG0.jpg'
    ],
    createdAt: '2023-11-12T14:45:00.000Z',
    deadline: '2023-11-18T18:00:00.000Z',
    bids: [
      {
        id: 'bid-3',
        taskId: 'task-2',
        workerId: 'user-3', // Shreshta
        amount: 10000,
        message: 'Can start tomorrow with premium quality paint and tools.',
        status: 'accepted',
        createdAt: '2023-11-13T09:30:00.000Z'
      }
    ]
  },
  {
    id: 'task-3',
    title: 'Website Development for Small Business',
    description: 'Looking for a web developer to create a responsive website for my small retail business. Need product catalog, contact form, and about page. Design should be modern and mobile-friendly.',
    category: 'Professional',
    subcategory: 'Web Development',
    clientId: 'user-4',
    status: 'open',
    budget: {
      min: 15000,
      max: 30000
    },
    location: {
      lat: 28.4595,
      lng: 77.0266,
      address: 'Sector 29, Gurugram, Haryana, India'
    },
    images: [
      'https://images.unsplash.com/photo-1547658719-da2b51169166?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHdlYnNpdGV8ZW58MHx8MHx8fDA%3D',
      'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8d2Vic2l0ZXxlbnwwfHwwfHx8MA%3D%3D'
    ],
    createdAt: '2023-11-08T14:45:00.000Z',
    deadline: '2023-12-10T23:59:00.000Z',
    bids: [
      {
        id: 'bid-4',
        taskId: 'task-3',
        workerId: 'user-5',
        amount: 25000,
        message: 'I specialize in creating modern, responsive websites for small businesses. Can deliver in 3 weeks with all requested features.',
        status: 'pending',
        createdAt: '2023-11-09T16:20:00.000Z'
      }
    ]
  },
  {
    id: 'task-4',
    title: 'Furniture Delivery and Assembly',
    description: 'Need someone to pick up a desk from the furniture store and assemble it at my home. The store is about 10 km from my location. The desk is boxed and weighs approximately 30 kg.',
    category: 'Home Services',
    subcategory: 'Furniture Assembly',
    clientId: 'user-1',
    status: 'open',
    budget: {
      min: 1500,
      max: 2500
    },
    location: {
      lat: 28.6129,
      lng: 77.2295,
      address: 'Laxmi Nagar, Delhi, India'
    },
    images: [
      'https://www.nismaayadecor.in/cdn/shop/files/nismaaya-paniz-kitchen-cabinet_1.png?v=1686306906&width=1080',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2l542QdshWDxZpHoIhQzKQVH5Rl-uuAYFwhB_80jOOD2BpxQrRvzd8CG2C5v-P_2TxX0&usqp=CAU'
    ],
    createdAt: '2023-11-11T13:10:00.000Z',
    deadline: '2023-11-14T20:00:00.000Z',
    bids: []
  },
  {
    id: 'task-5',
    title: 'Digital Marketing Strategy',
    description: 'Looking for a digital marketing expert to create a 3-month strategy for my online business. Need help with social media, content marketing, and SEO optimization. Budget is negotiable for the right candidate.',
    category: 'Professional',
    subcategory: 'Marketing',
    clientId: 'user-1',
    status: 'open',
    budget: {
      min: 20000,
      max: 35000
    },
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Rajouri Garden, Delhi, India'
    },
    images: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZGlnaXRhbCUyMG1hcmtldGluZ3xlbnwwfHwwfHx8MA%3D%3D',
      'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGRpZ2l0YWwlMjBtYXJrZXRpbmd8ZW58MHx8MHx8fDA%3D'
    ],
    createdAt: '2023-11-07T16:35:00.000Z',
    deadline: '2023-11-21T23:59:00.000Z',
    bids: []
  }
];

// Get a task with its client populated
export const getTaskWithClient = (taskId: string) => {
  const task = TASKS.find(t => t.id === taskId);
  if (!task) return null;
  
  const client = USERS.find(u => u.id === task.clientId);
  return {
    ...task,
    client
  };
};

// Get a task with its bids and workers populated
export const getTaskWithBids = (taskId: string) => {
  const task = TASKS.find(t => t.id === taskId);
  if (!task) return null;
  
  const bidsWithWorkers = task.bids.map(bid => {
    const worker = USERS.find(u => u.id === bid.workerId);
    return {
      ...bid,
      worker
    };
  });
  
  return {
    ...task,
    bids: bidsWithWorkers
  };
};

// Get filtered tasks
export const getFilteredTasks = (filters: {
  category?: string;
  search?: string;
  status?: string;
}) => {
  return TASKS.filter(task => {
    // Filter by category
    if (filters.category && task.category !== filters.category) {
      return false;
    }
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchTerm);
      const matchesDescription = task.description.toLowerCase().includes(searchTerm);
      if (!matchesTitle && !matchesDescription) {
        return false;
      }
    }
    
    // Filter by status
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    return true;
  });
};

// Generate a new bid for a task
export const createBid = (taskId: string, workerId: string, amount: number, message?: string): Bid => {
  return {
    id: `bid-${Date.now()}`,
    taskId,
    workerId,
    amount,
    message,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
};
