import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers,FaRocket } from 'react-icons/fa';
import Lottie from 'lottie-react';
import animationData from '../../assets/animations/property-dashboard.json';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const values = [
    {
      icon: <FaRocket />,
      title: "Innovation",
      description: "Pioneering smart solutions that revolutionize property management"
    },
    {
      icon: <FaUsers />,
      title: "Customer Focus",
      description: "Dedicated to making property management easier for our clients"
    },
    {
      icon: <FaChartLine />,
      title: "Excellence",
      description: "Committed to delivering top-tier solutions and support"
    }
  ];

  return (
    <section id="about" className="about">
      <div className="container">
        <div className={`section-header ${isVisible ? 'visible' : ''}`}>
          <h2>About RentMaster</h2>
        </div>

        <div className="about-content">
          <div className={`about-main ${isVisible ? 'visible' : ''}`}>
            <div className="mission-values">
              <div className="mission">
                <h3>Our Mission</h3>
                <p>
                  To simplify property management through an innovative system
                  that helps property owners manage their rooms efficiently,
                  communicate with tenants effectively through SMS, and scale
                  their business with ease.
                </p>
              </div>

              <div className="values-grid">
                {values.map((value, index) => (
                  <div
                    key={index}
                    className="value-card"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <div className="value-icon">{value.icon}</div>
                    <h4>{value.title}</h4>
                    <p>{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
