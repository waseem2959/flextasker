export type UserRole = 'client' | 'worker' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  rating: number;
  totalReviews: number;
  createdAt: string;
  bio?: string;
  skills?: string[];
  verified: boolean;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  clientId: string;
  client?: User;
  status: 'open' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  budget?: {
    min: number;
    max: number;
  };
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  images: string[];
  createdAt: string;
  deadline?: string;
  bids: Bid[];
  assignedWorkerId?: string;
}

export interface Bid {
  id: string;
  taskId: string;
  workerId: string;
  worker?: User;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
}

export interface Review {
  id: string;
  taskId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  taskId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface TaskFilterParams {
  category?: string;
  location?: string;
  status?: Task['status'];
  search?: string;
  sort?: 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'bids-high' | 'bids-low';
  radius?: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, role: UserRole, password: string) => Promise<boolean>;
  loading: boolean;
}
