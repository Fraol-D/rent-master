import './style.css'


document.querySelector('#app').innerHTML = `
  <div>
   
  </div>
`

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Navbar background opacity on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(46, 47, 48, 0.95)';
    } else {
        navbar.style.backgroundColor = 'rgba(46, 47, 48, 0.8)';
    }
});

