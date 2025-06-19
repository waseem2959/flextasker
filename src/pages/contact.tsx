import { Layout } from '../components/layout/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import { useState } from 'react';

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const [formState, setFormState] = useState<ContactFormState>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formState.name || !formState.email || !formState.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit form logic
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random success/failure for demonstration
          const isSuccess = Math.random() > 0.2;
          isSuccess ? resolve(true) : reject(new Error('Network error'));
        }, 1000);
      });
      
      toast({
        title: "Message Sent",
        description: "We've received your message and will get back to you soon.",
      });
      
      // Reset form
      setFormState({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Form submission error:', error);
      
      toast({
        title: "Error",
        description: `There was a problem sending your message: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-neutral-900 font-heading mb-4">Contact Us</h1>
            <p className="text-xl text-neutral-600 font-body max-w-2xl mx-auto">
              Have questions or need assistance? Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      className="border-neutral-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                      required
                      className="border-neutral-300"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formState.subject}
                    onChange={handleChange}
                    className="border-neutral-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    rows={6}
                    required
                    placeholder="Please provide details about your inquiry"
                    title="Your message to us"
                    aria-label="Message"
                    className="w-full p-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
          
          <div>
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Contact Information</h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-primary-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-neutral-900">Email</h3>
                    <p className="text-neutral-600">support@flextasker.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-primary-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-neutral-900">Phone</h3>
                    <p className="text-neutral-600">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-primary-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-neutral-900">Address</h3>
                    <p className="text-neutral-600">
                      123 Flextasker Way<br />
                      Suite 100<br />
                      San Francisco, CA 94103
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MessageSquare className="w-5 h-5 text-primary-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-medium text-neutral-900">Support Hours</h3>
                    <p className="text-neutral-600">
                      Monday - Friday: 9am - 6pm PST<br />
                      Saturday: 10am - 4pm PST<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Connect With Us</h2>
              <p className="text-neutral-600 mb-4">Follow us on social media for updates and tips.</p>
              <div className="flex space-x-4">
                <Button variant="outline" size="icon" className="rounded-full border-neutral-300">
                  <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-neutral-300">
                  <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-neutral-300">
                  <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-neutral-300">
                  <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                    <rect x="2" y="9" width="4" height="12"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </Button>
              </div>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
