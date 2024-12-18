import { FaBuilding, FaUsers, FaChartLine, FaUsersCog } from 'react-icons/fa';

const Features = () => {
  const features = [
    {
      icon: <FaBuilding />,
      title: "Building Management",
      points: [
        "Keep track of all your building's financials in one place",
        "View detailed building performance with simple graphs",
        "Identify the most profitable rooms or areas",
        "Manage brokers and see which ones bring in tenants",
        "Manage and track building expenses easily"
      ]
    },
    {
      icon: <FaChartLine />,
      title: "Money Management",
      points: [
        "Track payments easily",
        "Store receipts safely",
       
        "Calculate tax automatically",

        "Exchange between different currencies",
        "Track and manage expenses"
      ]
    },
    {
      icon: <FaUsers />,
      title: "Tenant Handling",
      points: [
        "Keep tenant info organized",
        "Send automatic reminders",
        "Save important documents",
        "Tenant Portal for easy communication",        "Track utility payments"
      ]
    },
    {
      icon: <FaUsersCog />,
      title: "Team Control",
      points: [
        "Different access levels",
        "Everything backed up online",
        "Easy to use for everyone",
        "Track who does what"
      ]
    }
  ];

  return (
    <section  className="features">
      <div className="container">
     
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <ul className="feature-list">
                {feature.points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="try-now-section">
          <h3>Experience These Features Now</h3>
          <p>Take a guided tour of RentMaster and see how it can transform your property management</p>
          <a href="/app/tryout" className="try-now-btn">Try It Out Now</a>
        </div>
      </div>
    </section>
  );
};

export default Features;