import '../../styles/components/navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <a href="#hero" className="logo">
        Rent<span className="logo-highlight">Master</span>
      </a>
      <div className="nav-links">
        <a href="#hero">
          <div className="nav-link-container">Home</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#features">
          <div className="nav-link-container">Features</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#pricing">
          <div className="nav-link-container">Pricing</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#faq">
          <div className="nav-link-container">FAQ</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#about">
          <div className="nav-link-container">About</div>
        </a>
        <div className="nav-separator">
          <div className="diamond-top"></div>
          <div className="nav-straightline"></div>
          <div className="diamond-bottom"></div>
        </div>
        <a href="#contact">
          <div className="nav-link-container">Contact</div>
        </a>
      </div>
      <div className="auth-buttons">
        <a href="/app/tryout">
          <button className="tryout-btn login-btn" href="/app/tryout">
            Try It Out
          </button>
        </a>
        <a href="/app">
        <button className="login-btn">Login</button>
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
