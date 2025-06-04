import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Team member interface
interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

// Company value interface
interface CompanyValue {
  id: number;
  title: string;
  description: string;
  icon: string;
}

// FAQ interface
interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const AboutUs = () => {
  // State for FAQ accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Team members data
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      bio: 'Sarah founded Flextasker with a vision to revolutionize how people find help for everyday tasks. With over 15 years in tech and marketplace platforms, she leads our strategic direction.',
      imageUrl: '/placeholder.svg'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'CTO',
      bio: 'Michael oversees all technical aspects of Flextasker. His expertise in scalable systems and security ensures our platform remains robust and reliable for all users.',
      imageUrl: '/placeholder.svg'
    },
    {
      id: 3,
      name: 'Priya Patel',
      role: 'Head of Operations',
      bio: 'Priya ensures Flextasker runs smoothly day-to-day. Her background in logistics and customer experience helps us maintain high service standards across the platform.',
      imageUrl: '/placeholder.svg'
    },
    {
      id: 4,
      name: 'David Rodriguez',
      role: 'Lead Designer',
      bio: 'David crafts the user experience that makes Flextasker intuitive and accessible. His human-centered design approach puts users at the heart of everything we build.',
      imageUrl: '/placeholder.svg'
    }
  ];

  // Company values data
  const companyValues: CompanyValue[] = [
    {
      id: 1,
      title: 'Trust & Safety',
      description: 'We prioritize creating a secure environment where clients and taskers can connect with confidence.',
      icon: '🛡️'
    },
    {
      id: 2,
      title: 'Opportunity For All',
      description: 'We believe in creating economic opportunities and flexibility for people from all walks of life.',
      icon: '🌱'
    },
    {
      id: 3,
      title: 'Quality Service',
      description: "We're committed to maintaining high standards through our verification and review systems.",
      icon: '⭐'
    },
    {
      id: 4,
      title: 'Community Focus',
      description: 'We strengthen local communities by connecting neighbors and supporting local skill exchange.',
      icon: '🤝'
    }
  ];

  // FAQs data
  const faqs: FAQ[] = [
    {
      id: 1,
      question: 'How did Flextasker begin?',
      answer: 'Flextasker was founded in 2020 when our founder Sarah Johnson recognized the need for a platform that could connect people who need help with everyday tasks to skilled individuals in their community. What started as a small local initiative has grown into a nationwide service with thousands of active users.'
    },
    {
      id: 2,
      question: 'What makes Flextasker different from other platforms?',
      answer: 'Flextasker stands out through our rigorous verification process, focus on local communities, fair pricing model that benefits both clients and taskers, and our commitment to safety and quality. We also reinvest a portion of our revenue into skill development programs for our tasker community.'
    },
    {
      id: 3,
      question: 'How does Flextasker ensure quality and safety?',
      answer: 'We implement a comprehensive verification process for all taskers, including identity verification, skills assessment, and background checks where appropriate. Our review system ensures accountability, and our secure payment system protects all transactions. We also provide insurance coverage for eligible tasks.'
    },
    {
      id: 4,
      question: "What are Flextasker's future plans?",
      answer: "We're focused on expanding our service to more cities, enhancing our mobile experience, introducing specialized categories for professional services, and developing training resources to help our taskers grow their skills and earnings potential."
    }
  ];

  // Render FAQ item
  const renderFaqItem = (faq: FAQ) => {
    const isExpanded = expandedFaq === faq.id;
    
    return (
      <div 
        key={faq.id} 
        className="border border-[#E5E7EB] rounded-lg overflow-hidden"
      >
        <button 
          className="w-full flex justify-between items-center p-4 md:p-6 text-left bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors duration-200"
          onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
        >
          <span className="font-medium text-[#1A2B34]">{faq.question}</span>
          <span className="text-[#6B7280] text-xl">
            {isExpanded ? '−' : '+'}
          </span>
        </button>
        {isExpanded && (
          <div 
            id={`faq-content-${faq.id}`}
            className="p-4 md:p-6 bg-white"
          >
            <p className="text-[#6B7280]">{faq.answer}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="bg-[#0C6478] text-white py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Our Mission is to Connect Skills with Needs</h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">Flextasker bridges the gap between people who need tasks done and skilled individuals ready to help, creating opportunities and strengthening communities.</p>
            <Button className="bg-[#09D1C7] hover:bg-[#07beb5] text-white font-medium px-6 py-3 rounded-lg text-lg">Join Our Community</Button>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1A2B34] mb-6">Our Story</h2>
              <div className="space-y-4 text-[#6B7280]">
                <p>Flextasker began with a simple observation: in our busy world, people often need help with everyday tasks, while others have valuable skills and time to offer.</p>
                <p>Founded in 2020, we set out to create a platform that would make it easy, safe, and reliable to connect these two groups, benefiting everyone involved.</p>
                <p>Today, Flextasker has grown into a thriving marketplace where thousands of tasks are completed every day, from home repairs and furniture assembly to graphic design and tutoring.</p>
                <p>Our platform has created flexible earning opportunities for people across the country while helping busy individuals and businesses accomplish more.</p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img 
                src="/placeholder.svg" 
                alt="Flextasker team working" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2B34] mb-4">Our Values</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">These core principles guide everything we do at Flextasker, from product development to customer support.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyValues.map((value) => (
              <Card key={value.id} className="p-6 border border-[#E5E7EB] hover:shadow-md transition-shadow duration-300">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-[#1A2B34] mb-3">{value.title}</h3>
                <p className="text-[#6B7280]">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2B34] mb-4">Meet Our Team</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">The passionate people behind Flextasker who work every day to improve our platform and support our community.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <img 
                  src={member.imageUrl} 
                  alt={member.name} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#1A2B34] mb-1">{member.name}</h3>
                  <p className="text-[#15919B] font-medium mb-3">{member.role}</p>
                  <p className="text-[#6B7280] text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2B34] mb-4">Frequently Asked Questions</h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">Learn more about Flextasker's history, mission, and future plans.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map(renderFaqItem)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-[#E8F6F8]">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A2B34] mb-6">Join the Flextasker Community</h2>
          <p className="text-[#6B7280] max-w-2xl mx-auto mb-8">Whether you need tasks done or want to offer your skills, Flextasker is the platform that brings people together.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#0C6478] hover:bg-[#064B55] text-white font-medium px-6 py-3 rounded-lg">Post a Task</Button>
            <Button className="bg-white border border-[#0C6478] text-[#0C6478] hover:bg-[#F1F5F9] font-medium px-6 py-3 rounded-lg">Become a Tasker</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
