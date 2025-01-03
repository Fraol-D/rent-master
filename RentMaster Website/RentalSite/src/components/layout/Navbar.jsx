import { useState, useEffect } from 'react';
import '../../styles/components/navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <a href="#hero" className="logo">
        Rent<span className="logo-highlight">Master</span>
      </a>

      {/* Hamburger Menu Button */}
      <button className="hamburger" onClick={toggleMenu} aria-label="Menu">
        <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
      </button>

      <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
        <a href="#hero" onClick={toggleMenu}>
          <div className="nav-link-container">Home</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#features" onClick={toggleMenu}>
          <div className="nav-link-container">Features</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#pricing" onClick={toggleMenu}>
          <div className="nav-link-container">Pricing</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#faq" onClick={toggleMenu}>
          <div className="nav-link-container">FAQ</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#about" onClick={toggleMenu}>
          <div className="nav-link-container">About</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#contact" onClick={toggleMenu}>
          <div className="nav-link-container">Contact</div>
        </a>
      </div>

      <div className={`auth-buttons ${isMenuOpen ? 'open' : ''}`}>
        <a href="/app/tryout">
          <button className="tryout-btn login-btn">Try It Out</button>
        </a>
        <a href="/app">
          <button className="login-btn">Login</button>
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
