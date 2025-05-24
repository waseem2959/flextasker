import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/crypto';

const prisma = new PrismaClient();

// Define proper types for our seed data to replace 'any' usage
interface CategoryData {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  phone: string | null;
  trustScore: number;
  city: string;
  state: string;
  country: string;
  bio: string;
  address: string;
  zipCode: string;
  totalEarnings: number;
  totalSpent: number;
  assignedTasks: Array<{ id: string; status: string; }>;
  postedTasks: Array<{ id: string; status: string; }>;
  reviewsReceived: Array<{ rating: number; }>;
}

interface TaskData {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  budget: number;
  budgetType: string;
  ownerId: string;
  assigneeId?: string | null;
  status: string;
  priority: string;
  tags: string[];
  requirements: string[];
  createdAt: Date;
  completionDate?: Date | null;
}

// Utility type for location data
interface LocationInfo {
  city: string;
  state: string;
  country: string;
}

async function main() {
  console.log('🌱 Starting FLEXTASKER database seeding...\n');

  try {
    // Create categories first
    console.log('📂 Creating task categories...');
    const categories = await createCategories();
    console.log(`✅ Created ${categories.length} categories\n`);

    // Create admin user
    console.log('👑 Creating admin user...');
    const admin = await createAdminUser();
    console.log(`✅ Admin user created: ${admin.email}\n`);

    // Create sample users
    console.log('👥 Creating sample users...');
    const users = await createSampleUsers();
    console.log(`✅ Created ${users.length} sample users\n`);

    // Create sample tasks
    console.log('📋 Creating sample tasks...');
    const tasks = await createSampleTasks(categories, users);
    console.log(`✅ Created ${tasks.length} sample tasks\n`);

    // Create sample bids
    console.log('💰 Creating sample bids...');
    const bids = await createSampleBids(tasks, users);
    console.log(`✅ Created ${bids.length} sample bids\n`);

    // Create sample reviews
    console.log('⭐ Creating sample reviews...');
    const reviews = await createSampleReviews(tasks, users);
    console.log(`✅ Created ${reviews.length} sample reviews\n`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Summary:`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Users: ${users.length + 1} (including admin)`);
    console.log(`   Tasks: ${tasks.length}`);
    console.log(`   Bids: ${bids.length}`);
    console.log(`   Reviews: ${reviews.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔐 Login Credentials:');
    console.log(`   Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD ?? 'admin123'}`);
    console.log(`   Sample User: user1@example.com / password123`);
    console.log(`   Sample Tasker: user6@example.com / password123\n`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function createCategories(): Promise<CategoryData[]> {
  const categoryData = [
    {
      name: 'Web Development',
      description: 'Website and web application development services',
      icon: 'code',
    },
    {
      name: 'Mobile Development',
      description: 'iOS and Android app development',
      icon: 'smartphone',
    },
    {
      name: 'Graphic Design',
      description: 'Logo design, branding, and visual content creation',
      icon: 'palette',
    },
    {
      name: 'UI/UX Design',
      description: 'User interface and experience design',
      icon: 'layout',
    },
    {
      name: 'Writing & Content',
      description: 'Content writing, copywriting, and editing services',
      icon: 'edit',
    },
    {
      name: 'Digital Marketing',
      description: 'SEO, social media, and online marketing services',
      icon: 'trending-up',
    },
    {
      name: 'Data Analysis',
      description: 'Data science, analytics, and business intelligence',
      icon: 'bar-chart',
    },
    {
      name: 'Translation',
      description: 'Language translation and localization services',
      icon: 'globe',
    },
    {
      name: 'Video & Animation',
      description: 'Video editing, motion graphics, and animation',
      icon: 'video',
    },
    {
      name: 'Consulting',
      description: 'Business consulting and advisory services',
      icon: 'briefcase',
    },
  ];

  const categories: CategoryData[] = [];
  for (const categoryInfo of categoryData) {
    const category = await prisma.category.create({
      data: categoryInfo,
    });
    categories.push(category);
  }

  return categories;
}

async function createAdminUser(): Promise<UserData> {
  const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD ?? 'admin123');
  
  return await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL ?? 'admin@flextasker.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true,
      phone: '+1234567890',
      trustScore: 5.0,
      city: 'San Francisco',
      state: 'California',
      country: 'United States',
      bio: 'Platform administrator with full access to all features.',
      address: '123 Admin Street',
      zipCode: '94105',
    },
  });
}

async function createSampleUsers(): Promise<UserData[]> {
  const cities: LocationInfo[] = [
    { city: 'New York', state: 'New York', country: 'United States' },
    { city: 'Los Angeles', state: 'California', country: 'United States' },
    { city: 'Chicago', state: 'Illinois', country: 'United States' },
    { city: 'Houston', state: 'Texas', country: 'United States' },
    { city: 'Phoenix', state: 'Arizona', country: 'United States' },
    { city: 'Philadelphia', state: 'Pennsylvania', country: 'United States' },
    { city: 'San Antonio', state: 'Texas', country: 'United States' },
    { city: 'San Diego', state: 'California', country: 'United States' },
    { city: 'Dallas', state: 'Texas', country: 'United States' },
    { city: 'San Jose', state: 'California', country: 'United States' },
  ];

  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
  const lastNames = ['Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  const users: UserData[] = [];
  for (let i = 0; i < 20; i++) {
    const password = await hashPassword('password123');
    const location = cities[i % cities.length];
    const isTasker = i >= 10; // First 10 are clients, next 10 are taskers
    
    const user = await prisma.user.create({
      data: {
        email: `user${i + 1}@example.com`,
        password,
        firstName: firstNames[i % firstNames.length],
        lastName: lastNames[i % lastNames.length],
        role: isTasker ? 'TASKER' : 'USER',
        emailVerified: true,
        phoneVerified: Math.random() > 0.3, // 70% have verified phone
        phone: Math.random() > 0.2 ? `+1555${String(Math.floor(Math.random() * 9000) + 1000)}` : null,
        trustScore: Number((Math.random() * 2 + 3).toFixed(1)), // 3.0 to 5.0
        ...location,
        bio: isTasker 
          ? `Experienced ${['developer', 'designer', 'writer', 'marketer', 'consultant'][i % 5]} ready to help with your projects.`
          : `Looking for talented professionals to help with various projects and tasks.`,
        address: `${Math.floor(Math.random() * 9999) + 1} ${['Main', 'Oak', 'Pine', 'Elm', 'Maple'][i % 5]} Street`,
        zipCode: String(Math.floor(Math.random() * 90000) + 10000),
      },
    });
    users.push(user);
  }

  return users;
}

async function createSampleTasks(categories: CategoryData[], users: UserData[]): Promise<TaskData[]> {
  // Define task templates with proper typing instead of using 'any'
  interface TaskTemplate {
    title: string;
    description: string;
    categoryName: string;
    budgetRange: [number, number];
    budgetType: 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    tags: string[];
    requirements: string[];
  }

  const taskTemplates: TaskTemplate[] = [
    {
      title: 'Build a responsive e-commerce website',
      description: 'Looking for an experienced web developer to create a modern, responsive e-commerce website with payment integration, user accounts, and admin panel. Must be mobile-friendly and SEO optimized.',
      categoryName: 'Web Development',
      budgetRange: [2000, 5000],
      budgetType: 'FIXED',
      priority: 'HIGH',
      tags: ['e-commerce', 'responsive', 'payment-integration'],
      requirements: ['5+ years experience', 'Portfolio examples', 'Knowledge of payment gateways'],
    },
    {
      title: 'Design modern logo and brand identity',
      description: 'Startup company needs a professional logo design and complete brand identity package including business cards, letterhead, and brand guidelines.',
      categoryName: 'Graphic Design',
      budgetRange: [500, 1500],
      budgetType: 'FIXED',
      priority: 'MEDIUM',
      tags: ['logo', 'branding', 'startup'],
      requirements: ['Graphic design portfolio', 'Brand identity experience', 'Vector file delivery'],
    },
    {
      title: 'Write SEO-optimized blog posts',
      description: 'Need 10 high-quality, SEO-optimized blog posts for a tech company. Each post should be 1000-1500 words, well-researched, and engaging.',
      categoryName: 'Writing & Content',
      budgetRange: [500, 1000],
      budgetType: 'FIXED',
      priority: 'MEDIUM',
      tags: ['seo', 'blog', 'tech-writing'],
      requirements: ['SEO writing experience', 'Tech industry knowledge', 'Research skills'],
    },
    {
      title: 'Develop mobile app for iOS and Android',
      description: 'Looking for mobile app developer to create a fitness tracking app with features like workout logging, progress tracking, and social sharing.',
      categoryName: 'Mobile Development',
      budgetRange: [5000, 15000],
      budgetType: 'FIXED',
      priority: 'HIGH',
      tags: ['mobile', 'fitness', 'cross-platform'],
      requirements: ['React Native or Flutter experience', 'App store publishing', 'API integration'],
    },
    {
      title: 'Create digital marketing strategy',
      description: 'Small business needs comprehensive digital marketing strategy including social media, email marketing, and PPC campaigns. Must include implementation plan.',
      categoryName: 'Digital Marketing',
      budgetRange: [1000, 3000],
      budgetType: 'FIXED',
      priority: 'MEDIUM',
      tags: ['strategy', 'social-media', 'ppc'],
      requirements: ['Digital marketing certification', '3+ years experience', 'Analytics knowledge'],
    },
    {
      title: 'Data analysis and visualization dashboard',
      description: 'Need data analyst to create interactive dashboard for sales data analysis. Should include charts, filters, and export functionality.',
      categoryName: 'Data Analysis',
      budgetRange: [1500, 4000],
      budgetType: 'FIXED',
      priority: 'HIGH',
      tags: ['dashboard', 'visualization', 'analytics'],
      requirements: ['Python or R experience', 'Dashboard tools knowledge', 'Statistics background'],
    },
    {
      title: 'Translate website content to Spanish',
      description: 'E-commerce website needs professional translation from English to Spanish for approximately 50 pages of content.',
      categoryName: 'Translation',
      budgetRange: [800, 1500],
      budgetType: 'FIXED',
      priority: 'MEDIUM',
      tags: ['spanish', 'website', 'e-commerce'],
      requirements: ['Native Spanish speaker', 'Translation certification', 'E-commerce experience'],
    },
    {
      title: 'Create promotional video for product launch',
      description: 'Tech startup needs a 2-3 minute promotional video for new product launch. Should include animations, voiceover, and music.',
      categoryName: 'Video & Animation',
      budgetRange: [2000, 5000],
      budgetType: 'FIXED',
      priority: 'HIGH',
      tags: ['promotional', 'animation', 'product-launch'],
      requirements: ['Video editing portfolio', 'Animation skills', 'Marketing video experience'],
    },
  ];

  const tasks: TaskData[] = [];
  const clientUsers = users.filter(u => u.role === 'USER');

  for (let i = 0; i < 15; i++) {
    const template = taskTemplates[i % taskTemplates.length];
    const category = categories.find(c => c.name === template.categoryName);
    const owner = clientUsers[i % clientUsers.length];
    const budget = Math.floor(Math.random() * (template.budgetRange[1] - template.budgetRange[0])) + template.budgetRange[0];
    
    const task = await prisma.task.create({
      data: {
        title: template.title,
        description: template.description,
        categoryId: category!.id,
        budget,
        budgetType: template.budgetType,
        ownerId: owner.id,
        status: ['OPEN', 'OPEN', 'OPEN', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 5)], // Most tasks are open
        priority: template.priority,
        isRemote: Math.random() > 0.3, // 70% remote
        tags: template.tags,
        requirements: template.requirements,
        city: owner.city,
        state: owner.state,
        country: owner.country,
        deadline: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null, // Random deadline within 30 days
        estimatedHours: Math.floor(Math.random() * 40) + 10, // 10-50 hours
      },
    });
    tasks.push(task);
  }

  return tasks;
}

async function createSampleBids(tasks: TaskData[], users: UserData[]): Promise<unknown[]> {
  const taskerUsers = users.filter(u => u.role === 'TASKER');
  const openTasks = tasks.filter(t => t.status === 'OPEN');
  
  const bids: unknown[] = [];
  
  for (const task of openTasks) {
    // Each open task gets 2-5 bids
    const numBids = Math.floor(Math.random() * 4) + 2;
    
    // Use toSorted() instead of sort() to avoid mutation
    const randomizedTaskers = [...taskerUsers].sort(() => Math.random() - 0.5);
    const taskBidders = randomizedTaskers.slice(0, numBids);
    
    for (const bidder of taskBidders) {
      const bidAmount = task.budget * (0.7 + Math.random() * 0.6); // 70% to 130% of task budget
      
      const bid = await prisma.bid.create({
        data: {
          taskId: task.id,
          bidderId: bidder.id,
          amount: Math.round(bidAmount),
          description: `I'm confident I can deliver high-quality work for this project. With my experience in ${task.tags.join(', ')}, I can complete this task efficiently and meet all your requirements.`,
          timeline: `${Math.floor(Math.random() * 10) + 3}-${Math.floor(Math.random() * 5) + 7} business days`,
          status: 'PENDING',
        },
      });
      bids.push(bid);
    }
  }

  return bids;
}

async function createSampleReviews(tasks: TaskData[], users: UserData[]): Promise<unknown[]> {
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const reviews: unknown[] = [];

  for (const task of completedTasks) {
    // Assign a random tasker to completed tasks
    const taskerUsers = users.filter(u => u.role === 'TASKER');
    const assignee = taskerUsers[Math.floor(Math.random() * taskerUsers.length)];
    
    // Update task with assignee
    await prisma.task.update({
      where: { id: task.id },
      data: { assigneeId: assignee.id, completionDate: new Date() },
    });

    // Create review from client to tasker
    // Extract nested ternary into clear conditional logic
    const randomValue = Math.random();
    let clientRating: number;
    
    if (randomValue > 0.2) {
      // 80% positive reviews (4-5 stars)
      clientRating = Math.floor(Math.random() * 2) + 4;
    } else {
      // 20% mixed reviews (2-3 stars)
      clientRating = Math.floor(Math.random() * 2) + 2;
    }

    // Determine review title based on rating
    let reviewTitle: string;
    if (clientRating >= 4) {
      reviewTitle = 'Excellent work!';
    } else if (clientRating >= 3) {
      reviewTitle = 'Good job';
    } else {
      reviewTitle = 'Could be better';
    }

    // Determine review comment based on rating
    let reviewComment: string;
    if (clientRating >= 4) {
      reviewComment = 'Outstanding work! The project was completed on time and exceeded my expectations. Great communication throughout.';
    } else if (clientRating >= 3) {
      reviewComment = 'Good work overall. Project was completed as requested with minor revisions needed.';
    } else {
      reviewComment = 'The work was acceptable but had some issues that needed to be addressed.';
    }
    
    const clientReview = await prisma.review.create({
      data: {
        taskId: task.id,
        authorId: task.ownerId,
        subjectId: assignee.id,
        rating: clientRating,
        title: reviewTitle,
        comment: reviewComment,
        communicationRating: Math.max(1, clientRating + Math.floor(Math.random() * 2) - 1),
        qualityRating: clientRating,
        timelinessRating: Math.max(1, clientRating + Math.floor(Math.random() * 2) - 1),
      },
    });
    reviews.push(clientReview);

    // Create review from tasker to client (50% chance)
    if (Math.random() > 0.5) {
      const taskerRating = Math.floor(Math.random() * 2) + 4; // Taskers usually rate clients positively
      
      const taskerReview = await prisma.review.create({
        data: {
          taskId: task.id,
          authorId: assignee.id,
          subjectId: task.ownerId,
          rating: taskerRating,
          title: 'Great client to work with',
          comment: 'Client provided clear requirements and feedback. Payment was prompt and communication was professional.',
          communicationRating: taskerRating,
          qualityRating: taskerRating,
          timelinessRating: taskerRating,
        },
      });
      reviews.push(taskerReview);
    }
  }

  return reviews;
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });