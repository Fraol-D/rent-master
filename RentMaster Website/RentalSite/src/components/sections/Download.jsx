import { FaWindows, FaApple, FaLinux,FaGooglePlay,FaAppStoreIos } from 'react-icons/fa';
import '../../styles/components/download.css';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

const Download = () => {
  const currentVersion = "0.2.0";
  const changelog = [
     {
      version: "0.2.1",
      date: "January 23, 2025", 
      changes: [
        "Fixed tenant portal timeline view to handle multiple agreements correctly",
        "Added server-side validation for :@@^&^@@: format",
        "Updated tenant portal link display logic",
       
        "Improved Ethiopian calendar converter text formatting and menu UI",
        "Fixed desktop version loading and API communication issues",
        "Fixed edit icon initial color when no saved theme is saved"
      ]
    },{
      version: "0.2.0",
      date: "January 17, 2025",
      changes: [
        "Initial Release"
      ]
    },
   
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
                <button className="platform-button" style={{backgroundColor: 'var(--Secondary-Color)'}} onClick={() => {
                  window.open('https://rentmaster.markethubet.com/downloads/windows', '_blank');
                }}>
                  <FaWindows className="platform-icon" />
                  <div className="platform-info">
                    <span>Windows</span>
                    <small>Windows 10/11 (64-bit)</small>
                    <span className="download-size" style={{fontSize: '0.8rem'}}>Download Size: 90MB</span>
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
                
              </div><div style={{display: 'flex', justifyContent: 'center', flexWrap: 'nowrap', marginTop: '1rem', gap: '1rem'}}>
                <button className="platform-button" disabled>
                  <FaAppStoreIos className="platform-icon" />
                  <div className="platform-info">
                    <span>iOS</span>
                    <small>Coming Soon to App Store</small>
                  </div>
                </button>
                <button className="platform-button" disabled>
                  <FaGooglePlay className="platform-icon" />
                  <div className="platform-info">
                    <span>Android</span>
                    <small>Coming Soon to Play Store</small>
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
