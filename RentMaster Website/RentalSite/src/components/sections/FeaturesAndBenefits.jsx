import { FaCheckCircle, FaServer, FaBell, FaChartBar, FaShieldAlt, FaUsers, FaCloud, FaBuilding } from 'react-icons/fa';

const FeaturesAndBenefits = () => {
  const features = [
    {
      icon: <FaServer />,
      title: "Centralized Management",
      description: "Keep all tenant info, payments, and documents in one place for easy access."
    },
    {
      icon: <FaBell />,
      title: "Automated Reminders",
      description: "Automatically send SMS and email reminders to tenants, reducing late payments."
    },
    {
      icon: <FaChartBar />,
      title: "Real-Time Insights",
      description: "Track building performance with simple graphs and reports."
    },
    {
      icon: <FaShieldAlt />,
      title: "Secure Document Storage",
      description: "Store all your important documents safely online."
    },
    {
      icon: <FaUsers />,
      title: "Custom User Access",
      description: "Assign roles and permissions to your team for better control."
    },
    {
      icon: <FaCloud />,
      title: "Cloud Backup",
      description: "Your data is safely backed up online, ensuring it's always accessible."
    },
    {
      icon: <FaBuilding />,
      title: "Multi-Building Management",
      description: "Manage multiple properties from one account with ease."
    }
  ];

  return (
    <section id="features-benefits" className="features-benefits">
      <div className="container">
        <h2>Features & Benefits</h2>
        <p className="section-description">Everything you need to manage your properties efficiently</p>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
        <img 
          src="/src/assets/img/pageBG/dots-top-right.png" 
          alt="" 
          className="bg-dots bg-dots-right"
        />
        <img 
          src="/src/assets/img/pageBG/dots-bottom-left.png" 
          alt="" 
          className="bg-dots bg-dots-left"
        />
      </div>
    </section>
  );
};

export default FeaturesAndBenefits; 