/**
 * ZENTRA — Preloader
 * Shows logo for 3–5 seconds then fades out.
 * Duration randomised slightly each load for a natural feel.
 */
(function () {
  // Duration between 3500ms and 4500ms
  var DURATION = Math.floor(Math.random() * 1000) + 3500;

  // Pass duration to CSS for the progress bar animation
  var preloader = document.getElementById('preloader');
  if (!preloader) return;

  var fill = preloader.querySelector('.preloader-bar-fill');
  if (fill) {
    fill.style.setProperty('--preloader-duration', (DURATION / 1000) + 's');
    fill.style.animationDuration = (DURATION / 1000) + 's, 1.5s';
  }

  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('fade-out');
    // Remove from DOM after CSS transition
    setTimeout(function () {
      if (preloader && preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
      // Re-enable scroll
      document.body.style.overflow = '';
    }, 650);
  }

  // Lock scroll while preloader is visible
  document.body.style.overflow = 'hidden';

  // Hide after DURATION
  setTimeout(hidePreloader, DURATION);

  // Also hide immediately once the page fully loads (if it takes longer than expected)
  window.addEventListener('load', function () {
    var remaining = DURATION - performance.now();
    if (remaining <= 0) {
      hidePreloader();
    } else {
      setTimeout(hidePreloader, remaining);
    }
  });
})();
