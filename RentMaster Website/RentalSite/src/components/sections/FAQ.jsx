import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {


      question: "What makes RentMaster different from other property management solutions?",
      answer: "RentMaster streamlines your entire property management process by offering centralized management for all tenant information, automated payment reminders via SMS and email, real-time building performance insights, secure online document storage, and comprehensive financial tracking - all in one user-friendly platform."
    },
    {


      question: "What features does RentMaster offer for financial management?",
      answer: "RentMaster provides comprehensive financial tools including payment tracking, receipt storage, income visualization through simple charts, automatic tax calculations, and multi-currency support. You can easily monitor both income and expenses, and generate detailed financial reports."
    },
    {


      question: "How does RentMaster help with tenant management?",
      answer: "RentMaster simplifies tenant management by organizing tenant information, automating payment reminders, securely storing important documents, and tracking utility payments. This helps reduce late payments and keeps all tenant-related information organized in one place."
    },
    {


      question: "What building management features are available?",
      answer: "RentMaster offers comprehensive building management tools including centralized financial tracking, detailed performance graphs, profitability analysis by room/area, broker management, and expense tracking. This helps you make informed decisions about your properties."
    },
    {


      question: "How does RentMaster handle team access and data security?",
      answer: "RentMaster provides different access levels for team members, tracks user activities, and ensures all data is securely backed up online. The platform is designed to be user-friendly while maintaining strict security standards to protect your information."
    },
    {
      question: "Can RentMaster handle multiple properties?",
      answer: "Yes! RentMaster is specifically designed to manage multiple buildings through one account. You can easily track and manage different properties, monitor their performance, and handle all related tasks from a single dashboard."
    },
    {
      question: "What if there's a feature I need that isn't currently available?",
      answer: "We actively welcome and value user feedback! Our development team regularly implements new features based on user suggestions and requirements. If there's something specific you need, please let us know and we'll work on implementing it to make RentMaster even more valuable for your business."
    }
  ];
  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="faq">
      <div className="container">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-accordion">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'active' : ''}`}
              onClick={() => toggleAccordion(index)}
            >
              <div className="faq-question">
                <h3>{faq.question}</h3>
                {openIndex === index ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;