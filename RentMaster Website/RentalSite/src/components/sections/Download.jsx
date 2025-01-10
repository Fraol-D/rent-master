import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';
import '../../styles/components/download.css';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

const Download = () => {
  const currentVersion = "1.2.0";
  const changelog = [
    {
      version: "1.2.0",
      date: "March 2024",
      changes: [
        "Added automated rent payment processing",
        "New maintenance request tracking system",
        "Improved dashboard analytics",
        "Bug fixes and performance improvements"
      ]
    },
    {
      version: "1.1.0",
      date: "January 2024",
      changes: [
        "Introduced tenant portal",
        "Enhanced reporting features",
        "Added document storage system"
      ]
    }
  ];

  return (
    <div className="app">
      <Navbar />
      <div className="content" style={{ paddingTop: '8rem' }}>
        <div className="download-container">
          <h1 className="download-title">Download RentMaster</h1>
          <div className="version-badge">Current Version: {currentVersion}</div>
          <p className="download-description">
          
            Be able to use rentmaster offline and sync when you're back online, and also store your files locally.
          </p>

          <div className="download-content-wrapper">
         
            <div className="download-options">
           
              <div className="platform-buttons">
                <button className="platform-button">
                  <FaWindows className="platform-icon" />
                  <div className="platform-info">
                    <span>Windows</span>
                    <small>Windows 10/11 (64-bit)</small>
                    <span className="download-size">Download Size: 68MB</span>
                  </div>
                </button>
                <button className="platform-button" disabled>
                  <FaApple className="platform-icon" />
                  <div className="platform-info">
                    <span>macOS</span>
                    <small>Coming Soon</small>
                  </div>
                </button>
                <button className="platform-button" disabled>
                  <FaLinux className="platform-icon" />
                  <div className="platform-info">
                    <span>Linux</span>
                    <small>Coming Soon</small>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="changelog-section">
            <h2>What's New</h2>
            <div className="changelog-container">
              {changelog.map((release) => (
                <div key={release.version} className="changelog-entry">
                  <div className="changelog-header">
                    <h3>Version {release.version}</h3>
                    <span className="changelog-date">{release.date}</span>
                  </div>
                  <ul>
                    {release.changes.map((change, index) => (
                      <li key={index}>{change}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

         
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Download;
