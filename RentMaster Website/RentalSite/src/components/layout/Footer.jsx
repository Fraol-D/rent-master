import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';
const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
        <a  className="logo" href="https://rentmaster.markethubet.com">Rent<span className="logo-highlight">Master</span></a>
          <p>Simplifying property management for landlords and property managers.</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <a href="https://rentmaster.markethubet.com/#features">Features</a>
          <a href="https://rentmaster.markethubet.com/#pricing">Pricing</a>
          <a href="https://rentmaster.markethubet.com/#contact">Contact</a>
          <a href="https://rentmaster.markethubet.com/download">Download</a>
        </div>
        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: RentMaster.et@gmail.com</p>
          <p>Phone: +2519-4450-9999</p>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <a href="https://web.facebook.com/profile.php?id=61571859038737" target="_blank" rel="noopener noreferrer">
              <FaFacebook style={{ marginRight: '8px', width:"30px",height:"30px" }} />
            </a>
            <a href="https://www.linkedin.com/company/rent-master-et/" target="_blank" rel="noopener noreferrer">
              <FaLinkedin style={{ marginRight: '8px', width:"30px", height:"30px" }} width="30px" />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 RentMaster. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer 