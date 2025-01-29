import '../../styles/components/navbar.css';
import { useState, useEffect } from 'react';
import { useGlobal } from '../../../../../src/renderer/components/GlobalContext'

const Navbar = () => {
  const {langSwitch, ChangeLanguage, text} = useGlobal()
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (windowWidth > 1030) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <a href="#hero" className="logo">
        Rent<span className="logo-highlight">Master</span>
      </a>
      <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
        <a
          href={window.location.pathname === '/' ? '#hero' : '/#hero'}
          onClick={handleLinkClick}
        >
          <div className="nav-link-container">
            {text.web.navbar.home}
            {windowWidth <= 1030 && <span className="nav-link-arrow" />}
          </div>
        </a>
        {windowWidth > 1030 && (
          <div className="nav-separator">
            <div className="diamond-top"></div>
            <div className="nav-straightline"></div>
            <div className="diamond-bottom"></div>
          </div>
        )}
        <a
          href={window.location.pathname === '/' ? '#features' : '/#features'}
          onClick={handleLinkClick}
        >
          <div className="nav-link-container">
            {text.web.navbar.features}
            {windowWidth <= 1030 && <span className="nav-link-arrow" />}
          </div>
        </a>
        {windowWidth > 1030 && (
          <div className="nav-separator">
            <div className="diamond-top"></div>
            <div className="nav-straightline"></div>
            <div className="diamond-bottom"></div>
          </div>
        )}
        <a
          href={window.location.pathname === '/' ? '#pricing' : '/#pricing'}
          onClick={handleLinkClick}
        >
          <div className="nav-link-container">
            {text.web.navbar.pricing}
            {windowWidth <= 1030 && <span className="nav-link-arrow" />}
          </div>
        </a>
        {windowWidth > 1030 && (
          <div className="nav-separator">
            <div className="diamond-top"></div>
            <div className="nav-straightline"></div>
            <div className="diamond-bottom"></div>
          </div>
        )}
        <a
          href={window.location.pathname === '/' ? '#about' : '/#about'}
          onClick={handleLinkClick}
        >
          <div className="nav-link-container">
            {text.web.navbar.about}
            {windowWidth <= 1030 && <span className="nav-link-arrow" />}
          </div>
        </a>
        {windowWidth > 1030 && (
          <div className="nav-separator">
            <div className="diamond-top"></div>
            <div className="nav-straightline"></div>
            <div className="diamond-bottom"></div>
          </div>
        )}
        <a
          href={window.location.pathname === '/' ? '#faq' : '/#faq'}
          onClick={handleLinkClick}
        >
          <div className="nav-link-container">
            {text.web.navbar.faq}
            {windowWidth <= 1030 && <span className="nav-link-arrow" />}
          </div>
        </a>

        {windowWidth > 1030 && (
          <div className="nav-separator">
            <div className="diamond-top"></div>
            <div className="nav-straightline"></div>
            <div className="diamond-bottom"></div>
          </div>
        )}
        <a
          href={window.location.pathname === '/' ? '#contact' : '/#contact'}
          onClick={handleLinkClick}
        >
          <div className="nav-link-container">
            {text.web.navbar.contact}
            {windowWidth <= 1030 && <span className="nav-link-arrow" />}
          </div>
        </a>
        {windowWidth > 1030 && (
          <div className="nav-separator">
            <div className="diamond-top"></div>
            <div className="nav-straightline"></div>
            <div className="diamond-bottom"></div>
          </div>
        )}
        <a href="/download" onClick={handleLinkClick}>
          <div className="nav-link-container">
            {text.web.download}
            {windowWidth <= 1030 && <span className="nav-link-arrow" />}
          </div>
        </a>
        {windowWidth <= 450 &&  <div className="auth-buttons">
        <a href="/login">
          <button className="tryout-btn login-btn">{text.app.login}</button>
        </a>
        <button onClick={() => langSwitch()}>{text.gen.ChangeLanguage}</button>
        <a href="/signup">
          <button className="login-btn"style={{color: 'black'}}>{text.web.getstarted}</button>
        </a>
      </div>}
        
      </div>
    {windowWidth >= 450 &&   <div className="auth-buttons">
        <a href="/login">
          <button className="tryout-btn login-btn">{text.app.login}</button>
        </a>
        <button onClick={() => langSwitch()}>{text.gen.changeLanguage}</button>
        <a href="/signup">
          <button className="login-btn"style={{color: 'black'}}>{text.web.getstarted}</button>
        </a>
      </div>} 
      <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
        <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
        <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
        <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
      </button>
    </nav>
  );
};

export default Navbar;
