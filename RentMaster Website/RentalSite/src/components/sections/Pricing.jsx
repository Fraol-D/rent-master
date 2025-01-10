import React, { useState, useEffect } from 'react';
import { FaCheck, FaStar } from 'react-icons/fa';
import { BsBuilding, BsPeople, BsRocket } from 'react-icons/bs';

const Pricing = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const plans = [
    {
      name: 'Starter Plan',
      icon: <BsBuilding />,
      price: '7,200',
      currency: 'Br.',
      features: ['1 to 30 rooms', '1,500 SMS', 'Unlimited Emails', 'Expense Tracker'],
    },
    {
      name: 'Growth Plan',
      icon: <BsRocket />,
      price: '14,000',
      currency: 'Br.',
      isPopular: true,
      features: ['30 to 90 rooms', '2,200 SMS', 'Unlimited Emails', 'Expense Tracker'],
    },
    {
      name: 'Pro Plan',
      icon: <BsPeople />,
      price: '26,000',
      currency: 'Br.',
      features: ['90 to 200 rooms', '3,000 SMS', 'Unlimited Emails', 'Expense Tracker'],
    },
  ];

  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className={`section-header ${isVisible ? 'visible' : ''}`}>
          <h2>Pricing Plans</h2>
          <p className="section-description" style={{marginBottom:'0'}}>
            Choose the perfect plan for your needs
          </p>
          <div className="save-banner">Save 15% on yearly plans</div>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`pricing-card ${plan.isPopular ? 'popular' : ''} ${
                isVisible ? 'visible' : ''
              }`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {plan.isPopular && (
                <div className="popular-badge">
                  <FaStar /> Most Popular
                </div>
              )}
              <div className="plan-icon">{plan.icon}</div>
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">
                  {plan.currency} {plan.price}
                </span>
                <span className="period">/month</span>
              </div>
              <div className="plan-details">
                {plan.features.map((feature, i) => (
                  <p key={i}>
                    <FaCheck /> {feature}
                  </p>
                ))}
              </div>
              <button
                className={`select-plan ${plan.isPopular ? 'popular-btn' : ''}`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        <div
          className={`enterprise-card ${isVisible ? 'visible' : ''}`}
          style={{ animationDelay: '0.8s' }}
        >
          <div className="enterprise-content">
            <div className="enterprise-left">
              <h3>Enterprise Plan</h3>
              <p className="enterprise-description">
                Managing more than 200 rooms? Let's create a custom solution for
                your business.
              </p>
              <div className="enterprise-features">
                <p>
                  <FaCheck /> Custom room capacity based on your needs
                </p>
                <p>
                  <FaCheck /> Custom SMS package
                </p>
                
              </div>
            </div>
            <div className="enterprise-right">
              <button className="select-plan">Contact Sales</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
