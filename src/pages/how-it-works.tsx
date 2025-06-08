import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';

const HowItWorks = () => {
  return (
    <Layout>
      <div className="py-16 bg-gradient-to-br from-primary-50 via-white to-primary-50 font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 font-heading">How FlexTasker Works</h1>
          <p className="mt-6 text-xl text-neutral-600 max-w-3xl mx-auto font-body leading-relaxed">
            Our platform connects clients with skilled workers through a simple, transparent bidding process
          </p>
        </div>
      </div>
      
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* For Clients */}
          <div className="mb-24 bg-white py-16 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold text-neutral-900 font-heading text-center mb-12">For Clients</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-primary-600 text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mb-4 text-neutral-900 font-heading">Describe what you need done</h3>
                <p className="text-neutral-600 font-body leading-relaxed">
                  Tell us what you need done, when you need it, and your budget. Add photos or details to help workers understand your requirements.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-primary-600 text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mb-4 text-neutral-900 font-heading">Set your budget</h3>
                <p className="text-neutral-600 font-body leading-relaxed">
                  Receive multiple bids from qualified workers. Compare prices, profiles, ratings, and reviews to find the right person for your task.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-primary-600 text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mb-4 text-neutral-900 font-heading">Receive quotes and pick the best Tasker</h3>
                <p className="text-neutral-600 font-body leading-relaxed">
                  Choose a worker, communicate via our secure chat, and get your task completed safely. Then leave a review of your experience.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 hover:shadow-lg">
                <Link to="/post-task">Post a Task Now</Link>
              </Button>
            </div>
          </div>
          
          {/* For Workers */}
          <div className="mb-24 bg-neutral-50 py-16 rounded-2xl">
            <h2 className="text-3xl font-bold text-neutral-900 font-heading text-center mb-12">For Taskers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-primary-600 text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mb-4 text-neutral-900 font-heading">Create Your Profile</h3>
                <p className="text-neutral-600 font-body leading-relaxed">
                  Sign up and create a detailed profile showcasing your skills, experience, and the services you offer to potential clients.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-primary-600 text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mb-4 text-neutral-900 font-heading">Browse & Bid</h3>
                <p className="text-neutral-600 font-body leading-relaxed">
                  Find tasks that match your skills in your area. Set your own competitive price and submit proposals to win work.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-primary-600 text-white rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mb-4 text-neutral-900 font-heading">Complete Tasks & Get Paid</h3>
                <p className="text-neutral-600 font-body leading-relaxed">
                  Once hired, communicate with the client, deliver quality work, and build your reputation through great reviews and ratings.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 hover:shadow-lg">
                <Link to="/tasks">Find Work Now</Link>
              </Button>
            </div>
          </div>
          
          {/* Why Choose FlexTasker */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-neutral-900 font-heading text-center mb-12">Why Choose FlexTasker</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-2 border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 rounded-xl">
                <CardContent className="p-8">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">Name Your Price</h3>
                      <p className="text-neutral-600 font-body leading-relaxed">
                        Our flexible bidding system lets workers set their own rates and clients choose based on value, not just price.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 rounded-xl">
                <CardContent className="p-8">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">Transparent Ratings</h3>
                      <p className="text-neutral-600 font-body leading-relaxed">
                        Our review system ensures accountability and helps you make informed decisions based on past performance.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 rounded-xl">
                <CardContent className="p-8">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">Secure Messaging</h3>
                      <p className="text-neutral-600 font-body leading-relaxed">
                        Our in-app chat keeps all communications in one place, making coordination and clarification simple.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 rounded-xl">
                <CardContent className="p-8">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">Local Focus</h3>
                      <p className="text-neutral-600 font-body leading-relaxed">
                        Find workers or tasks near you, supporting your local community and economy while getting things done.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Testimonials */}
          <div className="mb-24">
            <h2 className="text-3xl font-bold text-neutral-900 font-heading text-center mb-12">Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-2 border-neutral-200 hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className="absolute -top-4 -left-2 text-5xl text-primary-200 font-serif">"</div>
                  <div className="pt-6">
                    <p className="text-neutral-600 mb-6 italic font-body leading-relaxed">
                      I needed my apartment painted quickly before moving in. Within a day, I had 5 bids from qualified painters. I chose someone with great reviews who completed the job professionally and on time.
                    </p>
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full overflow-hidden mr-4 border-2 border-primary-100">
                        <img
                          src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXZhdGFyfGVufDB8fDB8fHww"
                          alt="Client"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 font-heading">Rohit Sharma</p>
                        <p className="text-neutral-500 text-sm font-body">Delhi, India</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-neutral-200 hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
                <CardContent className="p-8 relative">
                  <div className="absolute -top-4 -left-2 text-5xl text-primary-200 font-serif">"</div>
                  <div className="pt-6">
                    <p className="text-neutral-600 mb-6 italic font-body leading-relaxed">
                      As a plumber, I was looking for more flexible work opportunities. FlexTasker has been perfect - I set my own hours and rates, and have built a loyal customer base through positive reviews.
                    </p>
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full overflow-hidden mr-4 border-2 border-primary-100">
                        <img
                          src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGluZGlhbiUyMG1hbnxlbnwwfHwwfHx8MA%3D%3D"
                          alt="Worker"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 font-heading">Amit Patel</p>
                        <p className="text-neutral-500 text-sm font-body">Noida, India</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="bg-neutral-50 py-16 rounded-2xl">
            <h2 className="text-3xl font-bold text-neutral-900 font-heading text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">How do I post a task?</h3>
                <p className="text-neutral-600 mb-6 font-body leading-relaxed">
                  Simply sign up, click "Post a Task," and fill in the required details about your task, including description, location, and budget. Add photos if helpful.
                </p>

                <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">How does the bidding work?</h3>
                <p className="text-neutral-600 mb-6 font-body leading-relaxed">
                  Workers will place bids on your task, specifying their price and any relevant details. You can review each worker's profile and ratings before accepting a bid.
                </p>

                <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">Is there a fee to use FlexTasker?</h3>
                <p className="text-neutral-600 mb-6 font-body leading-relaxed">
                  Posting tasks is free. FlexTasker charges a small service fee only when a task is successfully completed.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">How do I get paid as a worker?</h3>
                <p className="text-neutral-600 mb-6 font-body leading-relaxed">
                  When you complete a task, payment is processed through our secure system. Funds are transferred to your account after the client confirms task completion.
                </p>

                <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">How are workers verified?</h3>
                <p className="text-neutral-600 mb-6 font-body leading-relaxed">
                  Workers can become verified by submitting identity documents and professional certifications, which are reviewed by our team. Verified workers display a badge on their profile.
                </p>

                <h3 className="font-bold text-lg mb-3 text-neutral-900 font-heading">What if there's a dispute?</h3>
                <p className="text-neutral-600 mb-6 font-body leading-relaxed">
                  Our support team is available to help resolve any issues between clients and workers. We have a fair dispute resolution process to ensure both parties are treated equitably.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 font-heading mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8 font-body leading-relaxed">
              Join FlexTasker today and experience a better way to get tasks done or find work opportunities.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 hover:shadow-lg">
                <Link to="/post-task">Post a Task</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200">
                <Link to="/tasks">Find Work</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorks;
