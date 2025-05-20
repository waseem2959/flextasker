import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CATEGORIES, TASKS } from '../data/mockData';
import { TaskCard } from '../components/task/TaskCard';
import { ArrowRight, MapPin, Search, CheckCircle } from 'lucide-react';

// Helper function to render category icons
const renderCategoryIcon = (iconName: string) => {
  switch(iconName) {
    case 'home':
      return (
        <svg className="h-6 w-6 text-flextasker-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg className="h-6 w-6 text-flextasker-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'user':
      return (
        <svg className="h-6 w-6 text-flextasker-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'clock':
      return (
        <svg className="h-6 w-6 text-flextasker-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6 text-flextasker-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
  }
};

const Index = () => {
  // Get 3 featured tasks
  const featuredTasks = TASKS.slice(0, 3);
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-flextasker-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 animate-slide-up">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Your Bridge to Getting Things Done
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Post a task and connect with skilled workers who bid their price. Find the perfect match for your needs.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-base">
                  <Link to="/post-task">Post a Task</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link to="/tasks">Find Work</Link>
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-full max-w-lg">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-flextasker-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d29ya2VyfGVufDB8fDB8fHww" 
                    alt="Worker completing a task"
                    className="relative rounded-lg shadow-lg max-h-96 object-cover"
                  />
                  <div className="absolute -right-8 -bottom-8 bg-white p-4 rounded-lg shadow-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                        <img 
                          src="https://cdn-icons-png.flaticon.com/128/4140/4140047.png"
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center text-yellow-500 text-sm font-medium">
                          ★★★★★ <span className="text-gray-700 ml-1">5.0</span>
                        </div>
                        <p className="text-gray-700 font-medium">Shreshta K.</p>
                        <p className="text-xs text-gray-500">Painter</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How FlexTasker Works</h2>
            <p className="mt-4 text-xl text-gray-600">
              A simple process to get your tasks done
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-flextasker-100 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-flextasker-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Post a Task</h3>
                <p className="text-gray-600">
                  Describe what you need done, when, and your budget. Add photos and location details.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-flextasker-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-flextasker-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Review Bids</h3>
                <p className="text-gray-600">
                  Compare bids from skilled workers. Check profiles, ratings, and choose the right person.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-flextasker-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-flextasker-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Get It Done</h3>
                <p className="text-gray-600">
                  Connect with your worker, finalize details via chat, and get your task completed.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/how-it-works">
              <Button variant="outline" size="lg">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
            <p className="mt-4 text-xl text-gray-600">
              Find skilled workers across various services
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((category) => (
              <Link 
                key={category.id} 
                to={`/tasks?category=${encodeURIComponent(category.name)}`}
                className="group"
              >
                <div className="border border-gray-200 rounded-lg p-6 text-center hover:border-flextasker-200 hover:shadow-sm transition-all">
                  <div className="h-12 w-12 rounded-full bg-flextasker-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-flextasker-200 transition-colors">
                    {renderCategoryIcon(category.icon)}
                  </div>
                  <h3 className="font-medium group-hover:text-flextasker-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {category.subcategories.slice(0, 3).join(', ')}
                    {category.subcategories.length > 3 && '...'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/tasks">
              <Button variant="default" size="lg">
                Browse All Tasks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Tasks */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Tasks</h2>
            <Link to="/tasks" className="text-flextasker-600 hover:text-flextasker-700 flex items-center font-medium">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </section>

      {/* User Testimonials (hidden in smaller screens) */}
      <section className="py-16 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Our Users Say</h2>
            <p className="mt-4 text-xl text-gray-600">
              Hear from workers and clients who've used FlexTasker
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 relative">
                <div className="absolute -top-4 -left-2 text-5xl text-flextasker-200">"</div>
                <div className="pt-4">
                  <p className="text-gray-600 mb-4">
                    I found a skilled plumber within hours who fixed my leaking sink at a price I could afford. The bidding system helped me get the best deal.
                  </p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/4140/4140048.png" 
                        alt="Client" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">Rohit</p>
                      <div className="flex items-center text-yellow-500 text-sm">
                        ★★★★★
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 relative">
                <div className="absolute -top-4 -left-2 text-5xl text-flextasker-200">"</div>
                <div className="pt-4">
                  <p className="text-gray-600 mb-4">
                    As a painter, FlexTasker has helped me find consistent work in my area. The platform is easy to use and I can set my own rates.
                  </p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/1154/1154448.png" 
                        alt="Worker" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">Priya</p>
                      <div className="flex items-center text-yellow-500 text-sm">
                        ★★★★
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 relative">
                <div className="absolute -top-4 -left-2 text-5xl text-flextasker-200">"</div>
                <div className="pt-4">
                  <p className="text-gray-600 mb-4">
                    The website is so intuitive! I posted my first task and had multiple bids within a few hours. The chat feature made communication seamless.
                  </p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/11498/11498793.png" 
                        alt="Client" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">Neha</p>
                      <div className="flex items-center text-yellow-500 text-sm">
                        ★★★★★
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-flextasker-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-xl max-w-2xl mx-auto">
            Join FlexTasker today and connect with skilled workers or find work opportunities near you.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" variant="default" className="bg-white text-flextasker-600 hover:bg-gray-100">
              <Link to="/post-task">Post a Task</Link>
            </Button>
            <Button asChild size="lg" variant="default" className="bg-white text-flextasker-600 hover:bg-gray-100">
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
