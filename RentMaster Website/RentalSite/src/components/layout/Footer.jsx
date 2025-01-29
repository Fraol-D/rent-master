import { FaFacebook, FaTwitter, FaLinkedin ,FaInstagram} from 'react-icons/fa';
import { useGlobal } from "../../../../../src/renderer/components/GlobalContext"
const Footer = () => {
  const { text } = useGlobal()
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
        <a  className="logo" href="https://rentmaster.markethubet.com">Rent<span className="logo-highlight">Master</span></a>
          <p>{text.web.slogan}</p>
        </div>
        <div className="footer-section">
          <h4>{text.web.navbar.quicklinks}</h4>
          <a href="https://rentmaster.markethubet.com/#features">{text.web.navbar.features}</a>
          <a href="https://rentmaster.markethubet.com/#pricing">{text.web.navbar.pricing}</a>
          <a href="https://rentmaster.markethubet.com/#contact">{text.web.navbar.contact}</a>
          <a href="https://rentmaster.markethubet.com/download">{text.web.download}</a>
        </div>
        <div className="footer-section">
          <h4>{text.web.navbar.contact}</h4>
          <p>{text.app.email}: RentMaster.et@gmail.com</p>
          <p>{text.app.phonenumber}: +2519-4450-9999</p>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <a href="https://web.facebook.com/profile.php?id=61571859038737" target="_blank" rel="noopener noreferrer">
              <FaFacebook style={{ marginRight: '8px', width:"30px",height:"30px" }} />
            </a>
            <a href="https://www.linkedin.com/company/rent-master-et/" target="_blank" rel="noopener noreferrer">
              <FaLinkedin style={{ marginRight: '8px', width:"30px", height:"30px" }} width="30px" />
            </a>
            <a href="https://www.instagram.com/rentmaster_official/" target="_blank" rel="noopener noreferrer">
              <FaInstagram style={{ marginRight: '8px', width:"30px", height:"30px" }} />
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