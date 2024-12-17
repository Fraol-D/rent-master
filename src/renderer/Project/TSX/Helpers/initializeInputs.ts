export function initializeInputBehavior() {

  // Create mutation observer to watch for new inputs
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // Find all inputs in the added element
          const inputs = node.getElementsByTagName('input');
          Array.from(inputs).forEach(attachInputBehavior);
        }
      });
    });
  });

  // Initial setup for existing inputs
  function setupExistingInputs() {
    const inputs = document.getElementsByTagName('input');
    Array.from(inputs).forEach(attachInputBehavior);
  }

  // Attach behavior to individual input
  function attachInputBehavior(input: HTMLInputElement) {
    // Skip if already initialized
    if (input.dataset.selectInitialized || input.type === 'checkbox') {
      return;
    }
  
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLInputElement).disabled) {
        (e.target as HTMLInputElement).select();
      }
    };

    input.addEventListener('click', handleClick);
    input.addEventListener('dblclick', handleClick);
    
    // Mark as initialized
    input.dataset.selectInitialized = 'true';
  }

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Setup existing inputs
  setupExistingInputs();

  // Return cleanup function
  return () => observer.disconnect();
} 