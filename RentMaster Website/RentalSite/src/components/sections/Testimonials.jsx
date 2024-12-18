import { useRef, useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../styles/components/testimonials.css';

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef(null);

  const testimonials = [
    {
      name: "Michael Chen",
      role: "Property Manager",
      company: "Urban Living Properties",
      text: "RentMaster has completely streamlined our operations. The automated payment tracking alone has saved us countless hours each month. Their customer support team is always responsive and helpful.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop"
    },
    {
      name: "Sarah Rodriguez",
      role: "Real Estate Investor",
      company: "Rodriguez Holdings",
      text: "As someone managing multiple properties, the reporting features are invaluable. I can track performance across my portfolio and make data-driven decisions. The mobile app is also a game-changer."
    },
    {
      name: "David Thompson",
      role: "Property Owner",
      company: "Thompson Properties",
      text: "The tenant communication features have improved our relationships significantly. Maintenance requests are handled efficiently, and the automated rent reminders have reduced late payments by 80%.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop"
    },
    {
      name: "Emily Watson",
      role: "Building Manager",
      company: "Skyline Apartments",
      text: "What impressed me most is how easy it was to get started. Within days, we had all our properties digitized and organized. The training support was exceptional."
    },
    {
      name: "James Miller",
      role: "Real Estate Developer",
      company: "Miller Development Group",
      text: "The analytics and reporting capabilities have transformed how we make decisions. We can now spot trends and opportunities that we were missing before."
    },
    {
      name: "Lisa Chang",
      role: "Property Administrator",
      company: "Pacific Properties",
      text: "The automated maintenance tracking and vendor management features have made my job so much easier. Everything is organized and accessible in one place."
    },
    {
      name: "Robert Martinez",
      role: "Portfolio Manager",
      company: "City Living Solutions",
      text: "Being able to access all property information from my phone has been revolutionary. I can respond to issues instantly, even when I'm away from the office."
    },
    {
      name: "Anna Kowalski",
      role: "Operations Manager",
      company: "Modern Living Spaces",
      text: "The financial reporting tools have saved us hours of work each month. Generating owner statements is now a one-click process instead of a day-long task."
    }
  ];

  const scrollToIndex = (index) => {
    if (sliderRef.current) {
      const newIndex = (index + testimonials.length) % testimonials.length;
      setActiveIndex(newIndex);
      
      // Calculate the scroll position
      const cardWidth = sliderRef.current.children[0].offsetWidth;
      const gap = 32; // 2rem gap
      const scrollPosition = (cardWidth + gap) * newIndex;
      
      // Apply transform to move the slider
      sliderRef.current.style.transform = `translateX(-${scrollPosition}px)`;
    }
  };

  const handlePrevClick = () => {
    scrollToIndex(activeIndex - 1);
  };

  const handleNextClick = () => {
    scrollToIndex(activeIndex + 1);
  };

  // Auto scroll
  useEffect(() => {
    const interval = setInterval(() => {
      scrollToIndex(activeIndex + 1);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [activeIndex]);

  return (
    <section id="testimonials" className="testimonials">
      <div className="container">
        <h2>What Our Clients Say</h2>
        <p className="section-description">
          Hear from property managers who transformed their business with RentMaster
        </p>
        
        <div className="testimonials-container">
          <button 
            className="nav-button prev-button" 
            onClick={handlePrevClick}
            aria-label="Previous testimonial"
          >
            <FaChevronLeft />
          </button>

          <div className="testimonials-slider" ref={sliderRef}>
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`testimonial-card ${index === activeIndex ? 'active' : ''}`}
              >
                <div className="testimonial-header">
                  {testimonial.image && (
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="testimonial-image"
                    />
                  )}
                  <div className="testimonial-author">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                    <p className="company">{testimonial.company}</p>
                  </div>
                </div>
                <p className="testimonial-text">{testimonial.text}</p>
              </div>
            ))}
          </div>

          <button 
            className="nav-button next-button" 
            onClick={handleNextClick}
            aria-label="Next testimonial"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 
