import React, { useState, useEffect } from 'react';
import { FaChartLine, FaUsers,FaRocket } from 'react-icons/fa';
import Lottie from 'lottie-react';
import animationData from '../../assets/animations/property-dashboard.json';
import { useGlobal } from "../../../../../src/renderer/components/GlobalContext"

const About = () => {
  const { text } = useGlobal()
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const values = [
    {
      icon: <FaRocket />,
      title: text.web.about.values.innovationTitle,
      description: text.web.about.values.innovationDescription
    },
    {
      icon: <FaUsers />,
      title: text.web.about.values.customerFocusTitle,
      description: text.web.about.values.customerFocusDescription
    },
    {
      icon: <FaChartLine />,
      title: text.web.about.values.excellenceTitle,
      description: text.web.about.values.excellenceDescription
    }
  ];

  return (
    <section id="about" className="about">
      <div className="container">
        <div className={`section-header ${isVisible ? 'visible' : ''}`}>
          <h2>{text.web.about.about} RentMaster</h2>
        </div>

        <div className="about-content">
          <div className={`about-main ${isVisible ? 'visible' : ''}`}>
            <div className="mission-values">
              <div className="mission">
                <h3>{text.web.about.mission.missionTitle}</h3>
                <p>
                  {text.web.about.mission.missionDescription}
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
