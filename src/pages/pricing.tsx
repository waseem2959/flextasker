import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check } from 'lucide-react';
import MainLayout from '../layouts/main-layout';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: {
    monthly: number;
    annually: number;
  };
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  buttonVariant?: 'default' | 'outline';
}

const plans: PricingPlan[] = [
  {
    name: 'Basic',
    price: {
      monthly: 0,
      annually: 0,
    },
    description: 'Essential features for individuals and small tasks',
    buttonVariant: 'outline',
    features: [
      { name: 'Post up to 5 tasks per month', included: true },
      { name: 'Basic task management', included: true },
      { name: 'Community support', included: true },
      { name: 'Limited search filters', included: true },
      { name: 'File uploads (5MB limit)', included: true },
      { name: 'Priority support', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Dedicated account manager', included: false },
      { name: 'Custom categories', included: false },
    ],
  },
  {
    name: 'Pro',
    price: {
      monthly: 19.99,
      annually: 199.99,
    },
    description: 'Advanced features for regular users with more tasks',
    popular: true,
    features: [
      { name: 'Unlimited task postings', included: true },
      { name: 'Advanced task management', included: true },
      { name: 'Priority community support', included: true },
      { name: 'All search filters', included: true },
      { name: 'File uploads (50MB limit)', included: true },
      { name: 'Priority support', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Dedicated account manager', included: false },
      { name: 'Custom categories', included: false },
    ],
  },
  {
    name: 'Business',
    price: {
      monthly: 49.99,
      annually: 499.99,
    },
    description: 'Complete solution for businesses with custom needs',
    buttonVariant: 'outline',
    features: [
      { name: 'Unlimited task postings', included: true },
      { name: 'Advanced task management', included: true },
      { name: 'Priority community support', included: true },
      { name: 'All search filters', included: true },
      { name: 'File uploads (500MB limit)', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom categories', included: true },
    ],
  },
];

const Pricing = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[hsl(206,33%,16%)] mb-4">Flexible Plans for Everyone</h1>
          <p className="text-[hsl(220,14%,46%)] max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Start with our free tier or upgrade for more features and capabilities.
          </p>
        </div>

        <Tabs defaultValue="monthly" className="w-full mb-12">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-[hsl(215,16%,90%)] p-1">
              <TabsTrigger 
                value="monthly" 
                className="data-[state=active]:bg-white data-[state=active]:text-[hsl(206,33%,16%)] data-[state=active]:shadow-sm"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger 
                value="annually" 
                className="data-[state=active]:bg-white data-[state=active]:text-[hsl(206,33%,16%)] data-[state=active]:shadow-sm"
              >
                Annually <Badge className="ml-1.5 bg-[hsl(142,72%,29%)]/10 text-[hsl(142,72%,29%)] border-[hsl(142,72%,29%)]/20">Save 20%</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="monthly" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <PricingCard key={plan.name} plan={plan} billingCycle="monthly" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="annually" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <PricingCard key={plan.name} plan={plan} billingCycle="annually" />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-[hsl(196,80%,95%)] rounded-xl p-8 md:p-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[hsl(206,33%,16%)] mb-4">Need a custom solution?</h2>
              <p className="text-[hsl(220,14%,46%)] mb-6">
                Contact our team to discuss custom plans for enterprise needs, special integrations, or dedicated support options.
              </p>
              <Button className="bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)]">
                Contact Sales
              </Button>
            </div>
            <div className="bg-white rounded-lg p-6 border border-[hsl(215,16%,80%)]">
              <h3 className="text-xl font-semibold text-[hsl(206,33%,16%)] mb-4">Enterprise includes:</h3>
              <ul className="space-y-3">
                {[
                  'Unlimited users',
                  'Custom workflow automation',
                  'SSO integration',
                  'Dedicated account manager',
                  'Custom reporting',
                  'API access',
                  '24/7 priority support'
                ].map((feature) => (
                  <li key={`feature-${feature}`} className="flex items-start">
                    <div className="mr-2 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(196,80%,95%)]">
                      <Check size={12} className="text-[hsl(196,80%,43%)]" />
                    </div>
                    <span className="text-[hsl(220,14%,46%)]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-[hsl(206,33%,16%)] mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-8 text-left">
            {[
              {
                question: 'Can I change my plan later?',
                answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of the next billing cycle.'
              },
              {
                question: 'Do you offer refunds?',
                answer: 'We offer a 14-day money-back guarantee for all paid plans. If you\'re not satisfied, contact our support team.'
              },
              {
                question: 'What payment methods do you accept?',
                answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.'
              },
              {
                question: 'Is there a contract or commitment?',
                answer: 'No long-term contracts. Monthly plans can be cancelled anytime, and annual plans can be cancelled before renewal.'
              }
            ].map((faq) => (
              <div key={`faq-${faq.question}`} className="p-6 border border-[hsl(215,16%,80%)] rounded-lg">
                <h3 className="font-medium text-[hsl(206,33%,16%)] mb-2">{faq.question}</h3>
                <p className="text-[hsl(220,14%,46%)]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: 'monthly' | 'annually';
}

const PricingCard = ({ plan, billingCycle }: PricingCardProps) => {
  const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.annually;
  
  return (
    <Card className={`relative p-6 flex flex-col h-full border ${
      plan.popular 
        ? 'border-[hsl(196,80%,43%)] shadow-md' 
        : 'border-[hsl(215,16%,80%)]'
    }`}>
      {plan.popular && (
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2">
          <Badge className="bg-[hsl(196,80%,43%)] text-white border-0 px-3 py-1">Most Popular</Badge>
        </div>
      )}
      
      <div>
        <h3 className="text-xl font-bold text-[hsl(206,33%,16%)]">{plan.name}</h3>
        <p className="text-[hsl(220,14%,46%)] mt-2 mb-4">{plan.description}</p>
        
        <div className="mt-4 mb-6">
          <span className="text-4xl font-bold text-[hsl(206,33%,16%)]">
            {price === 0 ? 'Free' : `$${price}`}
          </span>
          {price > 0 && (
            <span className="text-[hsl(220,14%,46%)] ml-2">
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          )}
        </div>
      </div>
      
      <ul className="space-y-3 mb-8 flex-grow">
        {plan.features.map((feature) => (
          <li key={`plan-feature-${feature.name}`} className="flex items-start">
            <div className={`mr-2 mt-1 flex h-5 w-5 items-center justify-center rounded-full ${
              feature.included 
                ? 'bg-[hsl(196,80%,95%)]' 
                : 'bg-[hsl(215,16%,90%)]'
            }`}>
              <Check size={12} className={feature.included ? 'text-[hsl(196,80%,43%)]' : 'text-[hsl(215,16%,60%)]'} />
            </div>
            <span className={feature.included ? 'text-[hsl(220,14%,46%)]' : 'text-[hsl(215,16%,60%)]'}>
              {feature.name}
            </span>
          </li>
        ))}
      </ul>
      
      <Button 
        className={`w-full mt-auto ${
          plan.buttonVariant === 'outline' 
            ? 'border-[hsl(196,80%,43%)] text-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,95%)]' 
            : 'bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)] text-white'
        }`}
        variant={plan.buttonVariant ?? 'default'}
      >
        {price === 0 ? 'Get Started' : 'Subscribe Now'}
      </Button>
    </Card>
  );
};

export default Pricing;
