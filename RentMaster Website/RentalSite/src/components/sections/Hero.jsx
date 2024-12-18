// Hero.jsx
import "../../styles/components/hero.css";
//import HeroBg from "../../assets/img/HeroBg.jpg";

const Hero = () => {
  return (
    <section id="hero" className="hero">
      <div className="wave-container">
       
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Rent<span className="logo-highlight">Master</span>
            </h1>
            <p className="hero-p">
              MAKE PROPERTY MANAGEMENT{" "}
              <span className="hero-text-highlight">EASY</span>
            </p>
            <p className="hero-p-2">
              Manage your properties better and easier with RentMaster. We
              handle everything from rent payments to paperwork, so you can
              spend more time growing your business.
            </p>
            <button className="hero-button">Get Started  {"==>"}</button>
          </div>
         
        </div>
      </div>
      <div className="curve-separator"></div>
    </section>
  );
};

export default Hero;
