// Hero.jsx
import '../../styles/components/hero.css';
import { useEffect, useState } from 'react';
import { FaDownload } from 'react-icons/fa';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="hero" className="hero">
      <div className="hero-background"></div>
      <div className="wave-container">
        <div className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
          <div className="hero-text">
            <h1 className="slide-in-left">
              Rent<span className="logo-highlight">Master</span>
            </h1>
            <p className="hero-p slide-in-left delay-1">
              MAKE PROPERTY MANAGEMENT{' '}
              <span className="hero-text-highlight">EASY</span>
            </p>
            <p className="hero-p-2 slide-in-left delay-2">
              Manage your properties better and easier with RentMaster. We
              handle everything from rent payments to paperwork, so you can
              focus on what matters most.
            </p>
            <div className="hero-buttons slide-in-left delay-3">
              <a
                href="/signup"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="hero-button primary">
                  Get Started
                  <svg
                    className="button-arrow"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                  >
                    <path
                      fill="currentColor"
                      d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z"
                    />
                  </svg>
                </button>
              </a>
              <a
                href="/app/tryout"
                style={{ textDecoration: 'none' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="hero-button secondary">
                  Try Out the Demo
                  <svg
                    className="button-arrow"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                  >
                    <path
                      fill="currentColor"
                      d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"
                    />
                  </svg>
                </button>
              </a>
            </div>
            <div className="download-text slide-in-left delay-4">
              <FaDownload className="download-icon" />
              Want to use RentMaster offline?
              <a href="/download" target="_blank" rel="noopener noreferrer" className="download-link">
                Download the application here
              </a>
            </div>
            <div className="hero-stats slide-in-left delay-4">
              <div className="stat-item">
                <span className="stat-number">90%</span>
                <span className="stat-label">Time Saved</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">256-bit</span>
                <span className="stat-label">Data Security</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Support Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="curve-separator"></div>
    </section>
  );
};

export default Hero;
