import { CreditCard, Phone, Shield } from 'lucide-react';
import React from 'react';

interface FeaturedTasker {
  id: string;
  name: string;
  photo: string;
  rating: number;
  totalRatings: number;
  completionRate: number;
  specialties: string;
  description: string;
  testimonial: string;
  testimonialAuthor: string;
  badges: {
    digitalId: boolean;
    paymentMethod: boolean;
    mobile: boolean;
  };
}

const featuredTaskersData: FeaturedTasker[] = [
  {
    id: '1',
    name: 'Hassan',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    rating: 5.0,
    totalRatings: 73,
    completionRate: 97,
    specialties: '24/7 emergency plumbing, gas fitting, renovations',
    description: 'Hassan has been in the plumbing industry for 11 years, and joined FlexTasker for better work life balance. He enjoys the opportunity to connect with customers from many different areas and backgrounds.',
    testimonial: 'A+++ for Hassan! I was left in quite a dilemma with a shower leak and he was there within the hour. Highly professional, punctual and he did it all with a friendly smile.',
    testimonialAuthor: 'Nic K.',
    badges: {
      digitalId: true,
      paymentMethod: true,
      mobile: true
    }
  },
  {
    id: '2',
    name: 'Philippe',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    rating: 4.9,
    totalRatings: 818,
    completionRate: 93,
    specialties: 'delivery, removals and interstate moves',
    description: 'Philippe manages a team of 12 removalists. FlexTasker has allowed him to expand his business to purchase more vehicles and grow his team.',
    testimonial: 'On time, very careful with boxes and things as needed. Wrapped the couch and mattress for us. Would highly recommend!',
    testimonialAuthor: 'Erin O.',
    badges: {
      digitalId: false,
      paymentMethod: true,
      mobile: true
    }
  },
  {
    id: '3',
    name: 'Star',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
    rating: 4.7,
    totalRatings: 17,
    completionRate: 95,
    specialties: 'residential, end of lease and commercial cleaning',
    description: 'Star joined FlexTasker when she was told by friends that it was a great place to find work. As a migrant, it gave her a head start. She really enjoys using the FlexTasker app to get work fast to suit her needs.',
    testimonial: 'I can\'t recommend Star highly enough. She is thorough, does everything to a high standard, has great communication and is very reliable.',
    testimonialAuthor: 'Pauline A.',
    badges: {
      digitalId: false,
      paymentMethod: true,
      mobile: true
    }
  },
  {
    id: '4',
    name: 'Geoff',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    rating: 5.0,
    totalRatings: 206,
    completionRate: 95,
    specialties: 'gardener, mixologist, chef, cleaner',
    description: 'Geoff is keen to beat the bias of ageism and FlexTasker is the perfect platform where he could be in control. He enjoys the flexibility so he can still pursue his passion in arts, acting and writing.',
    testimonial: 'We hired Geoff to give our indoor plants some care and attention. Geoff worked hard to clean, trim and repot our plants, and they now look healthier and happier than they did before.',
    testimonialAuthor: 'Art H.',
    badges: {
      digitalId: false,
      paymentMethod: true,
      mobile: true
    }
  }
];

export const FeaturedTaskers: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {featuredTaskersData.map((tasker) => (
        <div key={tasker.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <img
                src={tasker.photo}
                alt={tasker.name}
                className="w-16 h-16 rounded-full object-cover mr-4"
              />
              <div>
                <h3 className="text-xl font-bold text-neutral-900 font-heading">{tasker.name}</h3>
                <div className="flex items-center mt-1">
                  <span className="text-2xl font-bold text-primary-600">{tasker.rating}</span>
                  <div className="ml-2">
                    <div className="text-sm text-neutral-600">Overall rating</div>
                    <div className="text-sm text-neutral-600">{tasker.totalRatings} ratings</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-600">Completion rate</span>
                <span className="text-sm font-medium text-neutral-900">{tasker.completionRate}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${tasker.completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-neutral-900 mb-1">
                Specialities: {tasker.specialties}
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {tasker.description}
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              {tasker.badges.digitalId && (
                <div className="flex items-center bg-primary-50 px-2 py-1 rounded text-xs">
                  <Shield className="w-3 h-3 text-primary-600 mr-1" />
                  <span className="text-primary-700">Digital iD</span>
                </div>
              )}
              {tasker.badges.paymentMethod && (
                <div className="flex items-center bg-primary-50 px-2 py-1 rounded text-xs">
                  <CreditCard className="w-3 h-3 text-primary-600 mr-1" />
                  <span className="text-primary-700">Payment Method</span>
                </div>
              )}
              {tasker.badges.mobile && (
                <div className="flex items-center bg-primary-50 px-2 py-1 rounded text-xs">
                  <Phone className="w-3 h-3 text-primary-600 mr-1" />
                  <span className="text-primary-700">Mobile</span>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <h4 className="text-sm font-medium text-neutral-900 mb-2">What the reviews say</h4>
              <blockquote className="text-sm text-neutral-600 italic leading-relaxed">
                "{tasker.testimonial}"
              </blockquote>
              <p className="text-xs text-neutral-500 mt-2">— {tasker.testimonialAuthor}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
