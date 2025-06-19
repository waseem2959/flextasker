import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, MessageSquare, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/layout';
import { SEO } from '../utils/seo';

const HowItWorks = () => {
  return (
    <Layout>
      <SEO
        title="How It Works | Simple Task Marketplace | Flextasker"
        description="Learn how Flextasker works in 3 simple steps: Post a task, get offers from skilled taskers, and choose the best one. Safe, secure, and easy to use."
        canonicalUrl="https://flextasker.com/how-it-works"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to use Flextasker',
          description: 'Learn how to post tasks and hire skilled workers on Flextasker',
          step: [
            {
              '@type': 'HowToStep',
              name: 'Post your task',
              text: 'Describe what you need done, set your budget, and post your task'
            },
            {
              '@type': 'HowToStep', 
              name: 'Get offers',
              text: 'Receive offers from qualified taskers in your area'
            },
            {
              '@type': 'HowToStep',
              name: 'Choose & pay',
              text: 'Select the best tasker and pay securely through our platform'
            }
          ]
        }}
      />
      {/* Hero Section - Clean and Simple */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 font-heading">
            How FlexTasker works
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-body leading-relaxed">
            Post any task. Pick the best person. Get it done.
          </p>
          <p className="mt-4 text-lg text-gray-500 font-body">
            Connect with skilled workers in your community
          </p>
        </div>
      </div>

      {/* Main Process Section - Dual Track */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Toggle or Dual Headers */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 font-heading mb-4">
              Get tasks done or earn money - your choice
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8">
              <div className="text-lg text-gray-600">
                <span className="font-semibold text-primary-600">Need something done?</span> Post for free
              </div>
              <div className="text-lg text-gray-600">
                <span className="font-semibold text-primary-600">Want to earn?</span> Browse tasks
              </div>
            </div>
          </div>

          {/* 3-Step Process Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* For Clients */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 font-heading">
                Post a task in 3 simple steps
              </h3>
              
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Post your task for free
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Tell us what you need done, when and where it works for you. 
                      Add photos to help explain your task.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Receive quotes, pick the best person
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Get multiple quotes from verified Taskers. Check profiles, 
                      ratings and reviews. Chat to discuss details.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Task completed, release payment
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Your Tasker gets the job done. Pay securely through our platform 
                      and leave a review.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link to="/post-task">
                  <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 text-lg">
                    Post your task for free
                  </Button>
                </Link>
              </div>
            </div>

            {/* For Taskers */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 font-heading">
                Earn money in 3 simple steps
              </h3>
              
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Sign up and browse
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Create your profile, add your skills and start browsing tasks 
                      in your area. It's free to join.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Make offers
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Quote your price and timeline. Stand out by highlighting your 
                      experience and past work.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      Get paid
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Complete the task, get paid securely through FlexTasker. 
                      Build your reputation with great reviews.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link to="/tasks">
                  <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 text-lg">
                    Browse tasks and earn
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg">
              <Shield className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Verified profiles</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <CreditCard className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Secure payments</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <MessageSquare className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">In-app messaging</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Community support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Focus Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 font-heading mb-4">
              Your community, your way
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              FlexTasker connects you with skilled people in your neighborhood. 
              Support local workers while getting things done.
            </p>
          </div>

          {/* Success Stories - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=500&auto=format&fit=crop&q=60"
                    alt="Rohit"
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Rohit Sharma</p>
                    <p className="text-sm text-gray-600">Posted a painting task</p>
                  </div>
                </div>
                <p className="text-gray-700 italic leading-relaxed">
                  "I needed my apartment painted quickly before moving in. Within a day, 
                  I had 5 bids from qualified painters. The whole process was so easy!"
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  Task completed in Delhi
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=60"
                    alt="Amit"
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Amit Patel</p>
                    <p className="text-sm text-gray-600">Tasker - Plumber</p>
                  </div>
                </div>
                <p className="text-gray-700 italic leading-relaxed">
                  "FlexTasker gives me the flexibility I need. I set my own hours and 
                  rates, and have built a loyal customer base through positive reviews."
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  200+ tasks completed
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section - Simplified */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12 font-heading">
            Common questions
          </h2>
          
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Is it really free to post a task?
              </h3>
              <p className="text-gray-600">
                Yes! Posting tasks is completely free. FlexTasker only charges a small 
                service fee when a task is successfully completed.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                How do I know Taskers are trustworthy?
              </h3>
              <p className="text-gray-600">
                All Taskers have profiles with ratings, reviews, and verification badges. 
                You can also chat with them before accepting their offer to ensure they're 
                the right fit for your task.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                When do I pay for the task?
              </h3>
              <p className="text-gray-600">
                You only release payment after the task is completed to your satisfaction. 
                Your payment is held securely by FlexTasker until then.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                What if something goes wrong?
              </h3>
              <p className="text-gray-600">
                Our support team is here to help resolve any issues. We have a fair 
                dispute resolution process to ensure both parties are treated equitably.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-heading">
            Ready to get started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of people getting things done through FlexTasker
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/post-task">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg">
                Post a task for free
              </Button>
            </Link>
            <Link to="/tasks">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold px-8 py-3 text-lg">
                Browse tasks
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorks;