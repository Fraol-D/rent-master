export const setupAnimationObserver = () => {
  const observerOptions = {
    root: null,
    rootMargin: '-50px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-visible');
      } else {
        entry.target.classList.remove('animate-visible');
      }
    });
  }, observerOptions);

  const elements = document.querySelectorAll('section, .animate');
  elements.forEach(element => {
    observer.observe(element);
  });
}; 