import { FaHome, FaBuilding, FaCity, FaGlobeAmericas, FaEnvelope, FaMobileAlt } from 'react-icons/fa'

const Pricing = () => {
  const plans = [
    {
      name: 'Starter Plan',
      price: 'Br. 7,200',
      period: 'Monthly',
      rooms: '1 to 30 rooms',
      sms: '1,500 SMS',
      icon: <FaHome className="plan-icon" />
    },
    {
      name: 'Growth Plan',
      price: 'Br. 14,000',
      period: 'Monthly',
      rooms: '30 to 90 rooms',
      sms: '2,200 SMS',
      icon: <FaBuilding className="plan-icon" />
    },
    {
      name: 'Pro Plan',
      price: 'Br. 26,000',
      period: 'Monthly',
      rooms: '90 to 200 rooms',
      sms: '3,000 SMS',
      icon: <FaCity className="plan-icon" />
    },
    
  ]
 
  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <h2>Pricing Plans</h2>
        <p className="section-description">Choose the perfect plan for your needs</p>
        <div className="save-banner">
          <span>Save 15% on yearly plans</span>
        </div>
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div key={index} className="pricing-card">
              {plan.icon}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="period">/{plan.period}</span>
              </div>
              <div className="plan-details">
                <p className="rooms"><FaBuilding /> {plan.rooms}</p>
                <p className="sms"><FaMobileAlt /> {plan.sms}</p>
              </div>
              <button className="select-plan">Get Started</button>
            </div>
          ))}
        </div>

        <div className="enterprise-card">
          <div className="enterprise-content">
            <div className="enterprise-left">
              <FaGlobeAmericas className="plan-icon" />
              <h3>Enterprise Plan</h3>
              <p className="enterprise-description">
                Managing more than 200 rooms
              </p>
            </div>
            <div className="enterprise-right">
              <div className="enterprise-features">
                <p><FaBuilding /> Custom room capacity based on your needs</p>
                <p><FaMobileAlt /> Tailored SMS package</p>
              
              </div>
              <div className="enterprise-contact">
               
                <button className="select-plan">Contact us</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing 