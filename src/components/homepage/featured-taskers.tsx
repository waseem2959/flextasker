import React from 'react';

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  imgSrc: string;
  rating: number;
  date: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    quote: "Auraui has transformed our web presence with its intuitive and efficient design. Our site now performs better than ever.",
    name: "Devon Lane",
    role: "Account Assistant",
    imgSrc: "https://www.auraui.com/memeimage/boy1.jpeg",
    rating: 5,
    date: "2 weeks ago"
  },
  {
    id: '2',
    quote: "AuraUI has elevated our user experience to new heights. Seamless design and performance improvements are best.",
    name: "Christian Gray",
    role: "Frontend dev",
    imgSrc: "https://www.auraui.com/memeimage/man1.jpg",
    rating: 5,
    date: "1 month ago"
  }
];

export const Testimonial14: React.FC = () => {
  const styles = {
    section: "py-12 bg-white sm:py-16 lg:py-20",
    container: "px-4 mx-auto max-w-7xl sm:px-6 lg:px-8",
    heading: "text-3xl font-bold text-gray-900 sm:text-4xl xl:text-5xl font-pj text-center",
    subHeading: "mt-4 text-lg font-medium text-gray-600 sm:mt-8 text-center",
    gridContainer: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mt-8 md:mt-16",
    card: "bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 h-full",
    cardContent: "p-6",
    headerWrapper: "flex items-center mb-4",
    avatar: "w-16 h-16 rounded-full object-cover mr-4",
    nameWrapper: "flex-1",
    name: "text-xl font-bold text-neutral-900 font-heading",
    role: "text-sm text-neutral-600 mt-1",
    ratingWrapper: "flex items-center mt-2",
    star: "w-4 h-4 text-yellow-500 fill-current",
    ratingText: "ml-2 text-sm text-neutral-600",
    quoteBox: "bg-gray-100 rounded-2xl p-6 mb-4",
    quote: "text-lg font-normal leading-relaxed text-gray-900 font-pj italic",
    footerWrapper: "flex items-center justify-between pt-4 border-t border-neutral-200",
    badge: "flex items-center bg-primary-50 px-3 py-1 rounded-full text-xs",
    badgeText: "text-primary-700 font-medium",
    date: "text-xs text-neutral-500"
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={styles.star}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill={i < rating ? "currentColor" : "none"}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    ));
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div>
          <h2 className={styles.heading}>What our clients say about AuraUI</h2>
          <p className={styles.subHeading}>
            2,157 people have shared their positive experiences with us
          </p>
        </div>

        <div className={styles.gridContainer}>
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.headerWrapper}>
                  <img
                    className={styles.avatar}
                    src={testimonial.imgSrc}
                    alt={`${testimonial.name}'s avatar`}
                  />
                  <div className={styles.nameWrapper}>
                    <h3 className={styles.name}>{testimonial.name}</h3>
                    <p className={styles.role}>{testimonial.role}</p>
                    <div className={styles.ratingWrapper}>
                      {renderStars(testimonial.rating)}
                      <span className={styles.ratingText}>
                        {testimonial.rating}.0 rating
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.quoteBox}>
                  <blockquote className={styles.quote}>
                    "{testimonial.quote}"
                  </blockquote>
                </div>

                <div className={styles.footerWrapper}>
                  <div className={styles.badge}>
                    <svg className="w-3 h-3 text-primary-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={styles.badgeText}>Verified Client</span>
                  </div>
                  <span className={styles.date}>{testimonial.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};