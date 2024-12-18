import { useEffect } from 'react';
import { setupAnimationObserver } from './utils/animationObserver';
import Navbar from './components/layout/Navbar';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import PainPoints from './components/sections/PainPoints';
import Solution from './components/sections/Solution';
import Features from './components/sections/Features';
import HowItWorks from './components/sections/HowItWorks';
import Pricing from './components/sections/Pricing';
import Testimonials from './components/sections/Testimonials';
import FAQ from './components/sections/FAQ';
import Contact from './components/sections/Contact';
import Footer from './components/layout/Footer';
import './styles/index.css';
import { sendEmailAPIForWebsite } from '../../../src/Backend/OnlineServerApis';
function AppABC() {
  useEffect(() => {
    setupAnimationObserver();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.navbar');
      if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(46, 47, 48, 0.95)';
      } else {
        navbar.style.backgroundColor = 'rgba(46, 47, 48, 0.8)';
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const sendEmail = async (name, email, topic, message) => {
    const subject = `Form Website, ${email}, ${name}, ${topic}`;
    const text = `Email sent from website Name: ${name}, Email: ${email}, Topic: ${topic} <br /> Message: ${message}`;
    await sendEmailAPIForWebsite(email, text, subject);
  };
  return (
    <div className="app">
      <Navbar />
      <div className="content">
        <Hero />
        <PainPoints />
        <Solution />
        <Features />

        <Pricing />

        <About />
        <FAQ />
        <Contact sendEmail={sendEmail} />
      </div>
      <Footer />
    </div>
  );
}

export default AppABC;
