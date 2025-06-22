# FlexTasker - Modern Task Marketplace Platform

FlexTasker is a comprehensive marketplace platform that connects clients with skilled taskers, similar to Airtasker.com. Our platform enables users to post tasks, receive bids from qualified taskers, and complete work efficiently with built-in trust and payment systems.

## 🌟 **Current Implementation Status**

### **✅ Completed Core Features**

#### **Frontend Architecture (React + TypeScript)**
- **136 Components** - Full UI component library with ShadcnUI integration
- **19 Pages** - Complete page routing including Index, Login, Register, Dashboard, Tasks, Profile, etc.
- **23 Custom Hooks** - Comprehensive hook library for state management and API integration
- **PWA Support** - Progressive Web App with offline functionality, service workers, and app icons
- **Performance Optimized** - Code splitting, lazy loading, and performance monitoring
- **Responsive Design** - Mobile-first design with TailwindCSS

#### **Backend Infrastructure (Node.js + Express)**
- **REST API** - Complete API with Swagger documentation
- **Database** - PostgreSQL with Prisma ORM
- **Authentication** - JWT-based auth with role-based access control
- **Real-time Features** - Socket.io implementation for live messaging
- **File Upload** - Multer integration for file handling
- **Security** - Rate limiting, CORS, helmet.js security headers

#### **Key Functional Areas**
- **User Management** - Registration, login, profile management, verification system
- **Task System** - Task creation wizard, bidding system, task management
- **Messaging** - Real-time chat interface between clients and taskers
- **Admin Panel** - Administrative dashboard with user and task management
- **Trust & Safety** - Identity verification, review system, dispute resolution
- **Payment Integration** - Payment method selection and transaction handling

### **📁 Project Structure**

```
├── dist/                    # Production build output (62 optimized assets)
│   ├── assets/             # Bundled JS/CSS files with code splitting
│   ├── icons/              # PWA icons (8 sizes: 72x72 to 512x512)
│   ├── manifest.json       # PWA manifest
│   └── service-worker.js   # Service worker for offline functionality
│
├── e2e-tests/              # End-to-end testing with Playwright
│   ├── tests/
│   │   ├── accessibility.spec.ts    # WCAG compliance tests
│   │   └── basic-navigation.spec.ts # Core navigation tests
│   └── playwright.config.ts
│
├── src/                    # Frontend source code
│   ├── components/         # 136 UI components
│   │   ├── homepage/       # Landing page components
│   │   ├── ui/            # ShadcnUI component library
│   │   ├── dashboard/     # Dashboard-specific components
│   │   ├── task/          # Task management components
│   │   ├── chat/          # Real-time messaging
│   │   ├── admin/         # Admin panel components
│   │   ├── pwa/           # PWA-specific components
│   │   └── ...
│   │
│   ├── hooks/             # 23 custom React hooks
│   │   ├── use-auth.ts    # Authentication management
│   │   ├── use-tasks.ts   # Task operations
│   │   ├── use-socket.ts  # WebSocket integration
│   │   └── ...
│   │
│   ├── pages/             # 19 main application pages
│   │   ├── Index.tsx      # Homepage
│   │   ├── Dashboard.tsx  # User dashboard
│   │   ├── Tasks.tsx      # Task browsing
│   │   ├── Login.tsx      # Authentication
│   │   └── ...
│   │
│   ├── services/          # API and business logic
│   │   ├── api/           # REST API client
│   │   ├── auth/          # Authentication services
│   │   ├── cache/         # Caching layer
│   │   ├── monitoring/    # Performance tracking
│   │   └── ...
│   │
│   └── utils/             # Utility functions and helpers
│
├── server/                # Backend source code
│   ├── src/
│   │   ├── controllers/   # API request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API route definitions
│   │   ├── services/      # Business logic services
│   │   ├── utils/         # Server utilities
│   │   └── websockets/    # Socket.io handlers
│   │
│   └── prisma/           # Database schema and migrations
│
└── shared/               # Shared types and utilities
    ├── types/            # TypeScript definitions
    ├── hooks/            # Shared React hooks
    └── validation/       # Zod validation schemas
```

## 🚀 **Technology Stack**

### **Frontend Architecture**
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **TailwindCSS + ShadcnUI** for modern, responsive design
- **React Query** for server state management
- **React Router DOM** with protected routes
- **Socket.io Client** for real-time features
- **PWA** capabilities with service workers

### **Backend Architecture**
- **Node.js + Express** with TypeScript
- **PostgreSQL + Prisma ORM** for database operations
- **JWT Authentication** with role-based access
- **Socket.io Server** for WebSocket connections
- **Multer** for file upload handling
- **Swagger/OpenAPI** for API documentation

### **Development & Testing**
- **Jest** with 1 essential smoke test (App renders without crashing)
- **Playwright E2E Tests** for accessibility and navigation
- **ESLint + Prettier** for code quality
- **Performance Monitoring** with custom hooks and dashboards

## 🛠️ **Development Setup**

### **Prerequisites**
- **Node.js** v18+ (recommended v20 LTS)
- **PostgreSQL** 14+
- **Redis** (optional for advanced caching)

### **Quick Start**

1. **Clone and Install**:
   ```bash
   git clone https://github.com/waseem2959/Flextasker.git
   cd Flextasker
   npm install
   cd server && npm install && cd ..
   ```

2. **Environment Setup**:
   ```bash
   # Frontend
   cp .env.example .env.local
   # Backend
   cp server/.env.example server/.env
   ```

3. **Database Setup**:
   ```bash
   cd server
   npx prisma generate
   npx prisma migrate dev --name init
   npm run db:seed
   ```

4. **Start Development**:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend  
   npm run dev
   ```

5. **Access Application**:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **API Docs**: http://localhost:3000/api-docs

## 🧪 **Testing & Quality**

### **Current Test Suite**
- ✅ **1 Essential Test** - App component smoke test
- ✅ **E2E Tests** - Playwright accessibility and navigation tests
- ✅ **Build Success** - TypeScript compilation and Vite build
- ✅ **Code Quality** - ESLint and Prettier configured

### **Running Tests**
```bash
# Run unit test
npm test

# Run E2E tests
cd e2e-tests && npx playwright test

# Build verification
npm run build

# Code quality
npm run lint
npm run typecheck
```

## 📦 **Production Build**

The `dist/` folder contains the optimized production build:

- **62 JavaScript assets** with intelligent code splitting
- **PWA ready** with manifest.json and service worker
- **8 icon sizes** (72x72 to 512x512) for all devices
- **Optimized bundles** with tree shaking and minification

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🚀 **Deployment Ready**

### **Frontend Deployment**
- Optimized Vite build in `dist/` folder
- Static file hosting compatible (Vercel, Netlify, etc.)
- PWA capabilities with offline support

### **Backend Deployment**
- Docker-ready Node.js application
- PostgreSQL database with Prisma migrations
- Environment variable configuration

### **Key Environment Variables**
```env
# Frontend
VITE_API_URL=https://your-api-domain.com
VITE_SOCKET_URL=https://your-api-domain.com

# Backend
DATABASE_URL=postgresql://user:pass@host:5432/flextasker
JWT_SECRET=your-secure-secret
NODE_ENV=production
```

## 🎯 **Core Functionality**

### **✅ Implemented Features**
- User registration and authentication
- Task creation and management
- Real-time messaging system
- Admin dashboard
- Payment method selection
- Profile management
- PWA functionality
- Performance monitoring
- Accessibility compliance

### **🔧 Architecture Highlights**
- **Modular Design** - 136 reusable components
- **Type Safety** - Full TypeScript coverage
- **Performance** - Code splitting and lazy loading
- **Scalability** - Service-oriented architecture
- **Maintainability** - Clean code patterns and documentation

## 📋 **Available Scripts**

```bash
# Development
npm run dev              # Start frontend dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm test               # Run test suite
npm run lint           # Lint code
npm run typecheck      # TypeScript verification

# Server (from server/ directory)
npm run dev            # Start backend dev server
npm run build          # Build backend
npm run start          # Start production server
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

## 📞 **Support**

For questions or support, contact the development team at dev@flextasker.com.