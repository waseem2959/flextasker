# 🚀 Flextasker

**Flextasker** is a modern platform that connects clients and workers to get tasks done! Whether you're a client looking for help or a worker bidding on jobs, this app streamlines the process with an easy-to-use interface. Built with **React**, **Vite**, and **Tailwind CSS**, it’s designed for speed and scalability!

---

## 🌟 Features

- 🏠 **Homepage**: Browse through services and tasks.
- 💼 **Client Dashboard**: Post tasks and manage them easily.
- 👷‍♂️ **Worker Dashboard**: View tasks, place bids, and track progress.
- 🔒 **User Authentication**: Secure login and registration.
- 📝 **Post Tasks**: Clients can easily create and submit tasks.
- 📊 **Task Management**: View, edit, and track tasks in real time.
- 🌃 **Dark Mode**: Light and dark modes for your comfort.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn-UI (Radix UI)
- **State Management**: React Context
- **Forms**: React Hook Form + Zod for validation
- **Routing**: React Router

*⚠️ **No Backend yet!** This is a front-end demo using mock data. A future backend will power persistent data and real authentication.*

---

## 🌟 Future Goals

- 🖙 **Backend Implementation**: Node.js/Express or similar.
- 🛠️ **Database**: Integration with MongoDB/PostgreSQL for persistent storage.
- 🔑 **Authentication**: Real login/signup with JWT/OAuth.
- 📈 **AI Recommendations**: Personalize tasks using AI.
- 💳 **Payment Integration**: Allow workers to get paid for completed tasks.
- 📊 **Admin Dashboard**: Manage users, tasks, and more.

---

## 📂 Project Structure

```
flextasker/
├── public/               # Static assets
├── src/                  # Frontend application code
│   ├── components/       # React UI components
│   │   ├── layout/       # Layout structure components
│   │   ├── task/         # Task-related components
│   │   ├── user/         # User-related components
│   │   └── ui/           # Shadcn UI components
│   ├── contexts/         # React context providers
│   │   ├── auth-context.tsx  # Authentication state
│   │   └── theme-context.tsx # Dark/light mode
│   ├── data/             # Mock data for development
│   │   └── mockData.ts   # Simulated backend data
│   ├── hooks/            # Custom React hooks
│   │   ├── use-tasks.ts    # Task data operations
│   │   ├── use-bids.ts     # Bid operations
│   │   ├── use-auth.ts     # Authentication hooks
│   │   └── use-form-validation.ts # Form validation
│   ├── lib/              # Utility libraries
│   │   ├── utils.ts       # General utilities
│   │   └── query-types.ts # React Query typing
│   ├── pages/            # Application pages
│   │   ├── Dashboard.tsx  # User dashboard
│   │   ├── PostTask.tsx   # Task creation
│   │   ├── Profile.tsx    # User profile
│   │   ├── Login.tsx      # Authentication
│   │   └── Home.tsx       # Landing page
│   ├── services/         # API service layer
│   │   └── api/          # API client
│   │       ├── api-client.ts # HTTP client
│   │       ├── tasks.service.ts # Task API
│   │       ├── bids.service.ts  # Bids API
│   │       └── users.service.ts # User API
│   ├── types/            # TypeScript type definitions
│   │   ├── index.ts       # Core types
│   │   ├── api.ts         # API types
│   │   ├── enums.ts       # Enumeration types
│   │   ├── task.ts        # Task types with discriminated unions
│   │   └── errors.ts      # Error types
│   └── utils/            # Helper utilities
│       ├── validation.ts  # Zod validation schemas
│       └── error-handler.ts # Error handling
├── server/               # Backend API (in development)
│   └── src/
│       ├── controllers/    # API handlers
│       ├── routes/         # API routes
│       ├── services/       # Business logic
│       └── types/          # TypeScript definitions
└── .env                 # Environment variables
└── vite.config.ts        # Build configuration
└── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

### Key TypeScript Features

- **Strongly Typed APIs**: Type-safe API requests and responses
- **Centralized Enums**: Single source for all enum values (UserRole, TaskStatus, etc.)
- **Discriminated Unions**: Type-safe task state handling with state-specific properties
- **Type Guards**: Runtime type checking with isTaskComplete(), isTaskPending(), etc.
- **Form Validation**: Zod schemas integrated with form handling

## 🛠️ Core Functionality

### User Roles & Workflows

#### Client Journey
- **Registration/Login**: Secure authentication with email verification
- **Profile Creation**: Set up profile with contact details and preferences
- **Task Creation**: Post detailed tasks with descriptions, budgets, and requirements
- **Bid Review**: Evaluate incoming bids from taskers
- **Tasker Selection**: Choose the best tasker based on price, ratings, and proposal
- **Task Monitoring**: Track progress of assigned tasks
- **Payment Processing**: Pay for completed work with secure payment methods
- **Review & Rating**: Rate taskers and provide feedback after task completion

#### Tasker Journey
- **Registration/Login**: Specialized registration with skills and experience
- **Profile Enhancement**: Create detailed profile with portfolio and certifications
- **Task Discovery**: Browse available tasks filtered by skills and preferences
- **Bid Submission**: Create competitive bids with custom proposals
- **Task Acceptance**: Receive task assignments and confirmations
- **Work Tracking**: Update progress and communicate with clients
- **Task Completion**: Mark tasks as complete and request payment
- **Reputation Building**: Collect reviews and ratings to improve standing

#### Admin Dashboard
- **User Management**: Monitor and manage user accounts
- **Content Moderation**: Review and approve task listings
- **Dispute Resolution**: Handle conflicts between clients and taskers
- **Platform Analytics**: Track usage metrics and performance statistics
- **System Configuration**: Manage categories, settings, and platform parameters

### Detailed Feature Breakdown

#### Task Management System
- **Task Creation**: Rich text editor with attachment support
- **Task Categories**: Hierarchical category system with subcategories
- **Task Budget Options**: Fixed-price or hourly rate with negotiation flags
- **Location Settings**: Remote or in-person with address verification
- **Task Status Workflow**: Sophisticated state machine for task lifecycle
  - Open → In Progress → Completed/Cancelled/Disputed
- **Deadline Management**: Set due dates with reminder system
- **Task Requirements**: Structured requirements list with verification
- **Task Visibility Control**: Public, private, or invitation-only tasks

#### Bidding System
- **Bid Creation**: Detailed proposals with pricing and timeline
- **Bid Comparison**: Side-by-side comparison of multiple bids
- **Negotiation Tools**: Counter-offers and revision requests
- **Bid Withdrawal**: Option to withdraw bids before acceptance
- **Automatic Recommendations**: System-suggested best matches
- **Bid Analytics**: Insights on competitive pricing and success rates

#### User Profile System
- **Skill Management**: Detailed skill listing with proficiency levels
- **Portfolio Showcase**: Gallery of past work with descriptions
- **Verification System**: Identity and credential verification
- **Rating Algorithm**: Weighted rating system based on task complexity
- **Review Management**: Detailed feedback collection and display
- **Availability Calendar**: Schedule management for taskers

#### Search & Discovery
- **Advanced Filtering**: Multi-parameter search with saved preferences
- **Geolocation Integration**: Proximity-based task discovery
- **Category Navigation**: Visual category browser with popularity indicators
- **Trending Tasks**: Highlighting popular or urgent task categories
- **Personalized Recommendations**: AI-driven task suggestions
- **Saved Searches**: Notification system for matching new tasks

#### Communication System
- **Direct Messaging**: Built-in chat between clients and taskers
- **Notification Center**: Centralized alerts for all platform activities
- **Email Integration**: Email notifications for critical updates
- **File Sharing**: Secure document and image sharing
- **Comment Threads**: Task-specific discussion threads

#### Mobile Responsiveness
- **Adaptive Layouts**: Optimized UI for all device sizes
- **Touch-Friendly Controls**: Enlarged tap targets for mobile users
- **Offline Capabilities**: Basic functionality during connectivity issues
- **Push Notifications**: Real-time mobile alerts
- **Mobile-Optimized Forms**: Simplified input for on-the-go use

## 🔄 Current Development Stage

### Complete
- ✅ UI Components and page layouts
- ✅ Frontend routing and navigation
- ✅ Mock data implementation
- ✅ Basic form validation
- ✅ TypeScript improvements and type safety

### In Progress
- 🔄 Enhanced TypeScript integration
- 🔄 Form validation with Zod schemas
- 🔄 Advanced component patterns
- 🔄 API client type safety

### Upcoming
- ⏳ Backend implementation
- ⏳ Database integration
- ⏳ Authentication system
- ⏳ Real-time notifications

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/flextasker.git
cd flextasker

# Install dependencies
npm install
# or
yarn install
```

### Run the App

```bash
# Start the development server
npm run dev
# or
yarn dev
```

The app will be available at `http://localhost:5173` by default.

### Build for Production

```bash
# Build the app
npm run build
# or
yarn build

# Preview the production build
npm run preview
# or
yarn preview
```

## 🧪 TypeScript Enhancement

The project uses TypeScript with advanced patterns for type safety:

- **Discriminated Unions**: Used for task states and API responses
- **Runtime Validation**: Zod schemas ensure data integrity
- **API Type Safety**: End-to-end type checking for API requests and responses
- **Custom Hooks**: Type-safe hooks for form validation and API interactions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
