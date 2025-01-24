import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa'
import {useState } from 'react'
const Contact = ({sendEmail}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendEmail(name, email, topic, message);
    setName('');
    setEmail('');
    setTopic('');
    setMessage('');
    setSent(true)
  };
  return (
    <section id="contact" className="contact">
      <div className="container">
        <h2>Get In Touch</h2>
        <div className="contact-content">
          <div className="contact-text">
            <p>Ready to transform your property management experience with RentMaster? Whether you have questions about our features, need technical assistance, or want to discuss how we can help streamline your property management, our team is here to help.</p>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your Name" 
                required 
              />
            </div>
            <div className="form-group">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Your Email" 
                required 
              />
            </div>
            <div className="form-group">
              <select 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)}
              >
                <option value="">Select Topic</option>
                <option value="sales">Sales Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <textarea 
                placeholder="Your Message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                rows="5" 
                required
              />
            </div>
            <button 
              style={{marginLeft:"auto", marginTop:"0px",background: 'var(--Primary-Color)',color: 'black'}} 
              type="submit" 
              className="hero-button"
            >
              {sent ? <>Sent</>:<>Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Contact