import Lottie from 'lottie-react'
import { FaRocket, FaUsers, FaChartLine } from 'react-icons/fa'
import animationData from '../../assets/animations/property-dashboard.json'
import teamImage from '../../assets/img/team.jpeg'

const About = () => {
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
        <h2>About RentMaster</h2>
        <div className="about-content">
          <div className="about-main">
            <div className="mission-values">
              <div className="mission">
                <h3>Our Mission</h3>
                <p>To revolutionize property management through innovative technology solutions that empower property owners and managers to work smarter, not harder.</p>
              </div>
              
              <div className="values-grid">
                {values.map((value, index) => (
                  <div key={index} className="value-card">
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
  )
}

export default About 