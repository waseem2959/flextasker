import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryIcon } from '@/components/ui/category-icons';
import { Star } from '@/components/ui/star-rating';
import { ArrowRight, CheckCircle, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroSection } from '../components/homepage/hero-section';
import { Layout } from '../components/layout/Layout';
import { TaskCard } from '../components/task/task-card';
import { CATEGORIES, TASKS } from '../data/mock-data';

// Category icons are now handled by the CategoryIcon component

const Index = () => {
  // Get 3 featured tasks
  const featuredTasks = TASKS.slice(0, 3);
  
  return (
    <Layout>
      {/* Enhanced Hero Section */}
      <HeroSection />

      {/* How It Works */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">How FlexTasker Works</h2>
            <p className="mt-4 text-xl text-muted-foreground">
              A simple process to get your tasks done
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Post a Task</h3>
                <p className="text-muted-foreground">
                  Describe what you need done, when, and your budget. Add photos and location details.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Review Bids</h3>
                <p className="text-muted-foreground">
                  Compare bids from skilled workers. Check profiles, ratings, and choose the right person.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Get It Done</h3>
                <p className="text-muted-foreground">
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
            <h2 className="text-3xl font-bold text-foreground">Browse by Category</h2>
            <p className="mt-4 text-xl text-muted-foreground">
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
                <div className="border border-border rounded-lg p-6 text-center hover:border-primary-300 hover:shadow-sm transition-all">
                  <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition-colors">
                    <CategoryIcon name={category.icon} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.subcategories.slice(0, 3).join(', ')}
                    {category.subcategories.length > 3 && '...'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/tasks">
              <Button variant="outline" size="lg" className="border-[hsl(215,16%,80%)] text-[hsl(196,80%,43%)]">
                View All Categories
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
            <Link to="/tasks" className="text-primary-600 hover:text-primary-500 flex items-center font-medium">
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
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
              <CardContent className="p-6 pt-8 relative">
                <div className="absolute top-4 left-6 text-5xl text-primary-100 font-serif">"</div>
                <div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    I found a skilled plumber within hours who fixed my leaking sink at a price I could afford. The bidding system helped me get the best deal.
                  </p>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mr-4 border-2 border-primary-100">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/4140/4140048.png" 
                        alt="Rohit, satisfied client" 
                        className="h-full w-full object-cover"
                        width={48}
                        height={48}
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Rohit</p>
                      <div className="flex items-center text-amber-500 text-sm mt-1" aria-label="5 out of 5 stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={`rohit-star-${i + 1}`} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
              <CardContent className="p-6 pt-8 relative">
                <div className="absolute top-4 left-6 text-5xl text-primary-100 font-serif">"</div>
                <div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    As a painter, FlexTasker has helped me find consistent work in my area. The platform is easy to use and I can set my own rates.
                  </p>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mr-4 border-2 border-primary-100">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/1154/1154448.png" 
                        alt="Priya, professional painter" 
                        className="h-full w-full object-cover"
                        width={48}
                        height={48}
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Priya</p>
                      <div className="flex items-center text-amber-500 text-sm mt-1" aria-label="4 out of 5 stars">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Star key={`priya-star-${i + 1}`} className="h-4 w-4 fill-current" />
                        ))}
                        <Star key="priya-star-5" className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
              <CardContent className="p-6 pt-8 relative">
                <div className="absolute top-4 left-6 text-5xl text-primary-100 font-serif">"</div>
                <div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    The escrow payment system gives me peace of mind when hiring for home projects. I only release payment when I'm completely satisfied with the work.
                  </p>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden mr-4 border-2 border-primary-100">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/128/4140/4140051.png" 
                        alt="Amit, homeowner" 
                        className="h-full w-full object-cover"
                        width={48}
                        height={48}
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Amit</p>
                      <div className="flex items-center text-amber-500 text-sm mt-1" aria-label="5 out of 5 stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={`amit-star-${i + 1}`} className="h-4 w-4 fill-current" />
                        ))}
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
      <section className="py-12 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-xl max-w-2xl mx-auto">
            Join FlexTasker today and connect with skilled workers or find work opportunities near you.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="bg-white text-primary-600 hover:bg-surface">
              <Link to="/post-task">Post a Task</Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="bg-white text-primary-600 hover:bg-surface">
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
