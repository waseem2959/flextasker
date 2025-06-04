# FlexTasker - Modern Task Marketplace Platform

FlexTasker is a comprehensive marketplace platform that connects clients with skilled taskers, similar to Airtasker.com. Our platform enables users to post tasks, receive bids from qualified taskers, and complete work efficiently with built-in trust and payment systems.

## 🌟 **Core Marketplace Features**

### **For Task Posters (Clients)**
- **Task Creation**: Post detailed tasks with descriptions, budgets, deadlines, and location requirements
- **Bid Management**: Review and compare bids from multiple taskers
- **Tasker Selection**: Choose the best tasker based on ratings, reviews, and proposals
- **Progress Tracking**: Monitor task progress with real-time updates
- **Secure Payments**: Escrow-based payment system for safe transactions
- **Review System**: Rate and review taskers after task completion

### **For Taskers (Service Providers)**
- **Task Discovery**: Browse and search available tasks by category, location, and budget
- **Smart Bidding**: Submit competitive bids with custom proposals
- **Profile Building**: Showcase skills, experience, and portfolio
- **Trust Building**: Earn ratings and reviews to build reputation
- **Earnings Management**: Track income and payment history
- **Verification System**: Complete identity and skill verification

### **Platform Features**
- **Real-time Communication**: Built-in messaging system for client-tasker coordination
- **Advanced Search & Filtering**: Find tasks or taskers by location, skills, budget, and availability
- **Trust & Safety**: Comprehensive verification system with identity, phone, and document verification
- **Mobile-Responsive Design**: Seamless experience across all devices
- **Multi-language Support**: Internationalization ready with i18next
- **Dispute Resolution**: Built-in system for handling conflicts and disputes

## 🚀 **Technology Stack**

### **Frontend Architecture**
- **Framework**: React 18 with TypeScript for type-safe development
- **Styling**: TailwindCSS with ShadcnUI component library
- **State Management**: React Query for server state, React Context for client state
- **Routing**: React Router DOM with protected routes
- **Build Tool**: Vite for fast development and optimized builds
- **Real-time**: Socket.io client for live updates and messaging

### **Backend Architecture**
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Authentication**: JWT tokens with refresh token rotation
- **File Storage**: Multer for file uploads with cloud storage integration
- **Real-time**: Socket.io server for WebSocket connections
- **Job Queue**: BullMQ with Redis for background task processing

### **Infrastructure & DevOps**
- **API Documentation**: Swagger/OpenAPI 3.0 with interactive UI
- **Testing**: Jest, React Testing Library, and Cypress for E2E testing
- **Code Quality**: ESLint, Prettier, Husky for pre-commit hooks
- **Monitoring**: Performance monitoring and error tracking
- **Security**: Helmet.js, rate limiting, input validation, and CSRF protection

## 🛠️ **Development Setup**

### **Prerequisites**
- **Node.js**: v18+ (recommended v20 LTS)
- **Package Manager**: npm or yarn
- **Database**: PostgreSQL 14+
- **Redis**: For job queue and caching (optional for development)
- **Git**: For version control

### **Environment Setup**

1. **Clone the repository**:
   ```bash
   git clone https://github.com/waseem2959/Flextasker.git
   cd Flextasker
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Environment Configuration**:
   ```bash
   # Frontend environment
   cp .env.example .env.local

   # Backend environment
   cp server/.env.example server/.env
   ```

5. **Configure Environment Variables**:

   **Frontend (.env.local)**:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_SOCKET_URL=http://localhost:3000
   VITE_APP_NAME=FlexTasker
   ```

   **Backend (server/.env)**:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/flextasker"

   # JWT Secrets
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-secret-key

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Email Configuration (for notifications)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # File Upload
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760

   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   ```

6. **Database Setup**:
   ```bash
   cd server

   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev --name init

   # Seed the database with initial data
   npm run db:seed
   ```

7. **Start Development Servers**:

   **Terminal 1 - Backend**:
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 - Frontend**:
   ```bash
   npm run dev
   ```

8. **Access the Application**:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000
   - **API Documentation**: http://localhost:3000/api-docs

## 📦 Project Structure

The project follows a modular architecture as outlined in [ARCHITECTURE.md](./ARCHITECTURE.md).

Key directories:

```
src/               # Frontend source code
├── components/    # UI components
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── services/      # Service integrations
├── types/         # TypeScript type definitions
└── utils/         # Utility functions

server/            # Backend source code
├── prisma/        # Database schema and migrations
└── src/           # Server source files
    ├── controllers/  # Request handlers
    ├── middleware/   # Express middleware
    ├── services/     # Business logic
    └── routes/       # API routes
```

## 🧪 Testing

Run tests with:

```bash
# Unit and integration tests
npm run test

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

## 🔍 Code Quality

We maintain high code quality standards through:

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Husky for pre-commit hooks

Run quality checks with:

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## 🚢 Deployment

The application can be deployed using:

1. Vercel for the frontend
2. Heroku/Railway for the backend
3. Docker containers for both

Refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📝 Documentation

- [Architecture Guide](./ARCHITECTURE.md)
- [API Documentation](./server/src/docs/README.md)
- [Component Storybook](https://storybook.flextasker.com)
- [Codebase Improvements](./CODEBASE-IMPROVEMENTS.md)

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

For any questions or feedback, please reach out to us at dev@flextasker.com.
