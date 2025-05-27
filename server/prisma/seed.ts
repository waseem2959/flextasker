import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UserRole, TaskStatus, BidStatus, TaskPriority, BudgetType } from '../../shared/types/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clean up existing data
  await cleanup();

  // Create seed data
  await createCategories();
  const users = await createUsers();
  const tasks = await createTasks(users);
  await createBids(tasks, users);
  await createReviews(tasks, users);

  console.log('Database seeding completed successfully.');
}

async function cleanup() {
  console.log('Cleaning up existing data...');
  
  // Delete in reverse order of dependencies
  await prisma.notification.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.category.deleteMany({});
}

async function createCategories() {
  console.log('Creating categories...');

  const categories = [
    {
      name: 'Home Improvement',
      description: 'Services related to home repair, renovation, and maintenance',
      icon: 'home',
      isActive: true
    },
    {
      name: 'IT & Technology',
      description: 'Software development, website creation, technical support',
      icon: 'computer',
      isActive: true
    },
    {
      name: 'Delivery & Logistics',
      description: 'Package delivery, food delivery, moving services',
      icon: 'local_shipping',
      isActive: true
    },
    {
      name: 'Writing & Translation',
      description: 'Content writing, translation, proofreading',
      icon: 'edit',
      isActive: true
    },
    {
      name: 'Design & Creative',
      description: 'Graphic design, illustrations, video editing',
      icon: 'palette',
      isActive: true
    }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category
    });
  }

  console.log('Categories created successfully.');
}

async function createUsers() {
  console.log('Creating users...');

  const defaultPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'john.doe@example.com',
      passwordHash: defaultPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.USER,
      averageRating: 4.5,
      trustScore: 85,
      phoneVerified: true,
      emailVerified: true,
      city: 'New York',
      state: 'NY',
      country: 'USA',
      bio: 'Experienced professional looking for reliable help with various tasks',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
    },
    {
      email: 'jane.smith@example.com',
      passwordHash: defaultPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.TASKER,
      averageRating: 4.8,
      trustScore: 92,
      phoneVerified: true,
      emailVerified: true,
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      bio: 'Skilled tasker with 5+ years experience in home improvement and maintenance',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
    },
    {
      email: 'admin@flextasker.com',
      passwordHash: defaultPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      averageRating: null,
      trustScore: 100,
      phoneVerified: true,
      emailVerified: true,
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      bio: 'System administrator',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
    }
  ];

  const createdUsers = [];

  for (const user of users) {
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user
    });
    createdUsers.push(createdUser);
  }

  console.log('Users created successfully.');
  return createdUsers;
}

async function createTasks(users: any[]) {
  console.log('Creating tasks...');

  // Get all categories
  const categories = await prisma.category.findMany();

  const tasks = [
    {
      title: 'Fix kitchen sink',
      description: 'The kitchen sink is leaking and needs to be repaired. The issue appears to be with the pipes under the sink.',
      ownerId: users[0].id, // John Doe
      categoryId: categories.find(c => c.name === 'Home Improvement')?.id,
      assigneeId: users[1].id, // Jane Smith
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      budget: 100,
      budgetType: BudgetType.FIXED,
      isRemote: false,
      location: 'New York, NY',
      latitude: 40.7128,
      longitude: -74.0060,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      tags: ['plumbing', 'repair', 'kitchen'],
      requirements: ['Tools required', 'Experience with plumbing']
    },
    {
      title: 'Website development',
      description: 'Create a responsive website for a small business. The website should have 5 pages including home, about, services, portfolio, and contact.',
      ownerId: users[0].id, // John Doe
      categoryId: categories.find(c => c.name === 'IT & Technology')?.id,
      assigneeId: null,
      status: TaskStatus.OPEN,
      priority: TaskPriority.HIGH,
      budget: 500,
      budgetType: BudgetType.FIXED,
      isRemote: true,
      location: null,
      latitude: null,
      longitude: null,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      tags: ['web', 'development', 'react'],
      requirements: ['React experience', 'Responsive design']
    },
    {
      title: 'Logo design for startup',
      description: 'Design a modern and professional logo for a tech startup. The logo should be simple, memorable, and versatile.',
      ownerId: users[0].id, // John Doe
      categoryId: categories.find(c => c.name === 'Design & Creative')?.id,
      assigneeId: null,
      status: TaskStatus.OPEN,
      priority: TaskPriority.MEDIUM,
      budget: 200,
      budgetType: BudgetType.FIXED,
      isRemote: true,
      location: null,
      latitude: null,
      longitude: null,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      tags: ['design', 'logo', 'branding'],
      requirements: ['Vector files', 'Multiple color variations', 'Source files included']
    },
    {
      title: 'Package delivery across town',
      description: 'Need a small package (5 lbs) delivered from downtown to uptown. The package contains documents and is not fragile.',
      ownerId: users[1].id, // Jane Smith
      categoryId: categories.find(c => c.name === 'Delivery & Logistics')?.id,
      assigneeId: null,
      status: TaskStatus.OPEN,
      priority: TaskPriority.URGENT,
      budget: 25,
      budgetType: BudgetType.FIXED,
      isRemote: false,
      location: 'San Francisco, CA',
      latitude: 37.7749,
      longitude: -122.4194,
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      tags: ['delivery', 'urgent', 'package'],
      requirements: ['Vehicle required', 'Same-day delivery']
    }
  ];

  const createdTasks = [];

  for (const task of tasks) {
    const createdTask = await prisma.task.create({
      data: task
    });
    createdTasks.push(createdTask);
  }

  console.log('Tasks created successfully.');
  return createdTasks;
}

async function createBids(tasks: any[], users: any[]) {
  console.log('Creating bids...');

  const bids = [
    {
      taskId: tasks[0].id, // Fix kitchen sink
      bidderId: users[1].id, // Jane Smith
      amount: 120,
      description: 'I can fix your sink with high-quality parts. I have over 5 years of experience with plumbing work.',
      timeline: '2 days',
      status: BidStatus.ACCEPTED
    },
    {
      taskId: tasks[1].id, // Website development
      bidderId: users[1].id, // Jane Smith
      amount: 450,
      description: 'I can build this website using modern technologies like React and Tailwind CSS. I will deliver a fully responsive design.',
      timeline: '1 week',
      status: BidStatus.PENDING
    },
    {
      taskId: tasks[2].id, // Logo design
      bidderId: users[1].id, // Jane Smith
      amount: 180,
      description: 'I can create a professional logo for your startup. I will provide multiple concepts and revisions until you are satisfied.',
      timeline: '3 days',
      status: BidStatus.PENDING
    }
  ];

  for (const bid of bids) {
    await prisma.bid.create({
      data: bid
    });
  }

  console.log('Bids created successfully.');
}

async function createReviews(tasks: any[], users: any[]) {
  console.log('Creating reviews...');

  const reviews = [
    {
      taskId: tasks[0].id, // Fix kitchen sink
      reviewerId: users[0].id, // John Doe (task owner)
      revieweeId: users[1].id, // Jane Smith (task performer)
      rating: 5,
      title: 'Excellent work',
      comment: 'Jane fixed my sink quickly and professionally. The quality of work was excellent, and she was very pleasant to work with. Highly recommended!'
    }
  ];

  for (const review of reviews) {
    await prisma.review.create({
      data: review
    });
  }

  console.log('Reviews created successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
