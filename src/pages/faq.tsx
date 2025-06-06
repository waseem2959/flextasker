import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useState } from 'react';
import MainLayout from '../layouts/main-layout';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Toggle FAQ item expansion
  const toggleItem = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };
  
  // FAQ data
  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How do I post a task?',
      answer: 'To post a task, log in to your Flextasker account and click on the "Post a Task" button in the navigation bar. Fill in the task details including title, description, budget, and deadline. You can also add attachments or specify skills required. Once submitted, your task will be visible to potential taskers who can then place bids.',
      category: 'tasks'
    },
    {
      id: '2',
      question: 'How does bidding work?',
      answer: 'Once you post a task, taskers can place bids with their proposed price and timeframe. As the task poster, you can review all bids, check tasker profiles and ratings, and select the one that best meets your needs. You can also message taskers to clarify details before accepting a bid.',
      category: 'bids'
    },
    {
      id: '3',
      question: 'Is my payment secure?',
      answer: 'Yes, all payments on Flextasker are secure. We use industry-standard encryption and secure payment processors. Funds are held in escrow until you confirm that the task has been completed satisfactorily. This protects both task posters and taskers by ensuring that payment is only released when work is complete.',
      category: 'payments'
    },
    {
      id: '4',
      question: 'How do I become a tasker?',
      answer: 'To become a tasker, create a Flextasker account and complete your profile with skills, experience, and portfolio items. You can then browse available tasks and submit bids. To increase your chances of being selected, make sure your profile is complete, your communication is professional, and you build positive reviews over time.',
      category: 'account'
    },
    {
      id: '5',
      question: 'What happens if a task is not completed properly?',
      answer: 'If a task is not completed to your satisfaction, we recommend first discussing the issues directly with the tasker. Most issues can be resolved through communication. If you cannot reach a resolution, you can open a dispute through our platform, and our support team will review the case based on the evidence provided by both parties.',
      category: 'tasks'
    },
    {
      id: '6',
      question: 'How are service fees calculated?',
      answer: 'Flextasker charges a service fee of 10% for task posters and 15% for taskers, based on the final agreed price. These fees help us maintain the platform, provide customer support, secure payment processing, and continue improving our services for all users.',
      category: 'payments'
    },
    {
      id: '7',
      question: 'Can I cancel a task after posting it?',
      answer: 'Yes, you can cancel a task before accepting any bids without any penalty. If you\'ve already accepted a bid, you should communicate with the tasker about cancellation. Depending on the amount of work already done, a cancellation fee might apply according to our cancellation policy.',
      category: 'tasks'
    },
    {
      id: '8',
      question: 'How do I contact customer support?',
      answer: 'You can contact our customer support team through the "Contact" page on our website, by emailing support@flextasker.com, or by using the in-app chat support available during business hours. We aim to respond to all inquiries within 24 hours on business days.',
      category: 'account'
    },
    {
      id: '9',
      question: 'What is the Flextasker guarantee?',
      answer: 'The Flextasker guarantee ensures that if you\'re not satisfied with the completed task and cannot resolve the issue directly with the tasker, we\'ll step in to help mediate and may offer a partial or full refund depending on the circumstances. This guarantee applies to all tasks completed through our platform.',
      category: 'general'
    },
    {
      id: '10',
      question: 'How do I leave a review?',
      answer: 'After a task is marked as complete, both the task poster and tasker will be prompted to leave a review. You can rate on a 5-star scale and leave a written review about your experience. Reviews help maintain quality on our platform and guide other users in their decision-making.',
      category: 'general'
    },
  ];
  
  // Filter FAQ items based on search and category
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Group FAQs by category for the sidebar
  const categories = ['all', ...Array.from(new Set(faqItems.map(item => item.category)))];
  const categoryLabels: {[key: string]: string} = {
    all: 'All Questions',
    tasks: 'Tasks',
    bids: 'Bidding',
    payments: 'Payments',
    account: 'Account',
    general: 'General'
  };
  
  const categoryCount: {[key: string]: number} = {
    all: faqItems.length
  };
  
  categories.forEach(category => {
    if (category !== 'all') {
      categoryCount[category] = faqItems.filter(item => item.category === category).length;
    }
  });
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[hsl(206,33%,16%)] mb-4">Frequently Asked Questions</h1>
        <p className="text-[hsl(220,14%,46%)] mb-8 max-w-2xl">
          Find answers to common questions about using Flextasker. Can't find what you're looking for?{" "}
          <a href="/contact" className="text-[hsl(196,80%,43%)] hover:underline">Contact our support team</a>.
        </p>
        
        <div className="relative flex-grow max-w-xl mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(220,14%,46%)]" />
          <Input
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-[hsl(215,16%,80%)]"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="font-semibold text-[hsl(206,33%,16%)] mb-4">Categories</h2>
              <nav className="space-y-1">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "ghost"}
                    className={`w-full justify-start ${activeCategory === category ? 'bg-[hsl(196,80%,43%)]' : 'hover:bg-[hsl(215,16%,95%)]'}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {categoryLabels[category]}
                    <span className="ml-auto bg-[hsl(215,16%,95%)] text-[hsl(220,14%,46%)] rounded-full px-2 py-0.5 text-xs">
                      {categoryCount[category]}
                    </span>
                  </Button>
                ))}
              </nav>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold text-[hsl(206,33%,16%)] mb-2">No matching questions found</h2>
                <p className="text-[hsl(220,14%,46%)]">Try adjusting your search or category selection</p>
                <Button 
                  className="mt-4 bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)]"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory('all');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map(item => (
                  <Card key={item.id} className="p-4">
                    <button
                      className="w-full text-left flex justify-between items-center"
                      onClick={() => toggleItem(item.id)}
                    >
                      <h3 className="text-lg font-medium text-[hsl(206,33%,16%)]">{item.question}</h3>
                      {expandedItems.includes(item.id) ? (
                        <ChevronUp className="h-5 w-5 text-[hsl(220,14%,46%)]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[hsl(220,14%,46%)]" />
                      )}
                    </button>
                    
                    {expandedItems.includes(item.id) && (
                      <div className="mt-4 text-[hsl(220,14%,46%)] text-sm pt-4 border-t border-[hsl(215,16%,90%)]">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FAQ;
