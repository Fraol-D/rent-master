import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';
const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
        <a  className="logo">Rent<span className="logo-highlight">Master</span></a>
          <p>Simplifying property management for landlords and property managers.</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: RentMaster.et@gmail.com</p>
          <p>Phone: +2519-4450-9999</p>
          <FaFacebook style={{ marginRight: '8px', width:"30px" }} />
          <FaLinkedin style={{ marginRight: '8px', width:"30px" }} width="30px" />
          <FaTwitter style={{ marginRight: '8px', width:"30px" }} />
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 RentMaster. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer 