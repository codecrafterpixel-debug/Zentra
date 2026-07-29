/**
 * ZENTRA — Home Page JS
 * Trending, New Arrivals, Category tiles, Stats counter, Testimonials
 */

// ── Trending Products ──────────────────────────────────────────────────────

function renderTrending() {
  const container = document.getElementById('trending-scroll');
  if (!container) return;

  const trending = Storage.getTrending();
  if (trending.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm">No trending products right now.</p>`;
    return;
  }

  container.innerHTML = trending.map((product) => {
    const image = product.images?.[0] || Storage._svg('#1a1a1a', '#2a2a2a', 'ZENTRA');
    return `
      <div class="product-card" onclick="openProductDetail('${product.id}')" style="width:260px;flex-shrink:0">
        <div class="product-card-image img-zoom">
          <img src="${image}" alt="${product.name}" loading="lazy"/>
          <div class="product-badges">
            <span class="badge badge-trending">🔥 Trending</span>
            ${product.newArrival ? `<span class="badge badge-new">✨ New</span>` : ''}
            <span class="badge ${product.stock === 'instock' ? 'badge-instock' : 'badge-outofstock'}">
              ${product.stock === 'instock' ? '● In Stock' : '○ Out of Stock'}
            </span>
          </div>
        </div>
        <div class="product-card-body">
          <div class="product-category-tag">${categoryLabel(product.category)}</div>
          <div class="product-name">${product.name}</div>
          <div class="product-price-row">
            <div class="product-price">
              <span class="price-current">${formatPrice(product.price)}</span>
              ${product.originalPrice > product.price
                ? `<span class="price-original">${formatPrice(product.originalPrice)}</span>`
                : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── New Arrivals ───────────────────────────────────────────────────────────

function renderNewArrivals() {
  const container = document.getElementById('new-arrivals-grid');
  if (!container) return;

  const arrivals = Storage.getNewArrivals().slice(0, 4);
  if (arrivals.length === 0) {
    container.innerHTML = `<p class="text-muted text-sm" style="grid-column:1/-1">No new arrivals yet.</p>`;
    return;
  }

  container.innerHTML = arrivals.map((product, i) => {
    const image = product.images?.[0] || Storage._svg('#1a1a1a', '#2a2a2a', 'ZENTRA');
    const discount = product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

    return `
      <div class="product-card reveal delay-${i + 1}" onclick="openProductDetail('${product.id}')">
        <div class="product-card-image img-zoom">
          <img src="${image}" alt="${product.name}" loading="lazy"/>
          <div class="product-badges">
            <span class="badge badge-new">✨ New Arrival</span>
            ${product.trending ? `<span class="badge badge-trending">🔥 Trending</span>` : ''}
            <span class="badge ${product.stock === 'instock' ? 'badge-instock' : 'badge-outofstock'}">
              ${product.stock === 'instock' ? '● In Stock' : '○ Out of Stock'}
            </span>
          </div>
        </div>
        <div class="product-card-body">
          <div class="product-category-tag">${categoryLabel(product.category)}</div>
          <div class="product-name">${product.name}</div>
          <div class="product-description">${product.description}</div>
          <div class="product-price-row">
            <div class="product-price">
              <span class="price-current">${formatPrice(product.price)}</span>
              ${product.originalPrice > product.price
                ? `<span class="price-original">${formatPrice(product.originalPrice)}</span>`
                : ''}
              ${discount > 0 ? `<span class="price-discount">${discount}% OFF</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Trigger reveals
  setTimeout(() => {
    container.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  }, 100);
}

// ── Category Tiles ────────────────────────────────────────────────────────

function renderCategories() {
  const container = document.getElementById('categories-grid');
  if (!container) return;

  const categories = [
    { id: 'graphic',   icon: '🎨', name: 'Graphic Tees',  desc: 'Anime, Streetwear, Vintage' },
    { id: 'oversized', icon: '👕', name: 'Oversized',      desc: 'Drop-Shoulder Fits' },
    { id: 'basics',    icon: '⬜', name: 'Basics',         desc: 'Heavyweights & Solids' },
    { id: 'polo',      icon: '👔', name: 'Polo Tees',      desc: 'Smart-Casual Collars' },
    { id: 'custom',    icon: '✨', name: 'Custom Print',   desc: 'Print on Demand' },
  ];

  container.innerHTML = categories.map((cat, i) => {
    const count = Storage.getByCategory(cat.id).length;
    return `
      <a href="products.html?cat=${cat.id}" class="category-tile reveal delay-${i + 1}" style="text-decoration:none">
        <span class="category-tile-icon">${cat.icon}</span>
        <div class="category-tile-name">${cat.name}</div>
        <div class="category-tile-count">${count} product${count !== 1 ? 's' : ''}</div>
      </a>
    `;
  }).join('');

  setTimeout(() => {
    container.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  }, 200);
}

// ── Stats Counter ─────────────────────────────────────────────────────────

function animateCounter(el, target, suffix = '') {
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current.toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function initStats() {
  const statsSection = document.getElementById('stats-section');
  if (!statsSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        document.querySelectorAll('[data-counter]').forEach((el) => {
          const target = parseInt(el.dataset.counter);
          const suffix = el.dataset.suffix || '';
          animateCounter(el, target, suffix);
        });
        observer.disconnect();
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(statsSection);
}

// ── Testimonials ──────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Arjun Mehta',
    location: 'Ahmedabad',
    rating: 5,
    text: 'The oversized tee quality is insane for the price. Print hasn\'t faded a bit after 20+ washes. Zentra is my go-to now.',
  },
  {
    name: 'Priya Shah',
    location: 'Surat',
    rating: 5,
    text: 'Ordered custom tees for our college fest and they were PERFECT. Delivered in 3 days, print quality was top-tier.',
  },
  {
    name: 'Rohan Verma',
    location: 'Mumbai',
    rating: 5,
    text: 'The fabric is so breathable. Been wearing their basics daily this summer — feels premium even after multiple washes.',
  },
  {
    name: 'Sneha Patel',
    location: 'Vadodara',
    rating: 5,
    text: 'Got matching couple tees for our anniversary trip. The quality exceeded expectations. Definitely ordering again!',
  },
  {
    name: 'Harsh Kapoor',
    location: 'Delhi',
    rating: 5,
    text: 'The anime graphic tee I ordered is literally a work of art. Colors are vibrant and the cotton is ultra-soft.',
  },
  {
    name: 'Diya Joshi',
    location: 'Pune',
    rating: 5,
    text: 'Customer service is amazing. They helped me with sizing and the delivery was super fast. 10/10 would recommend.',
  },
];

function renderTestimonials() {
  const container = document.getElementById('testimonials-container');
  if (!container) return;

  container.innerHTML = TESTIMONIALS.map((t) => `
    <div class="testimonial-card" style="min-width:300px;flex-shrink:0">
      <div class="testimonial-stars">${'★'.repeat(t.rating)}</div>
      <div class="testimonial-text">"${t.text}"</div>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.name[0]}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-location">📍 ${t.location}</div>
        </div>
      </div>
    </div>
  `).join('');

  // Auto-scroll
  let scrollPos = 0;
  const scrollAmount = 320;

  setInterval(() => {
    scrollPos += scrollAmount;
    if (scrollPos >= container.scrollWidth - container.clientWidth) {
      scrollPos = 0;
    }
    container.scrollTo({ left: scrollPos, behavior: 'smooth' });
  }, 3500);
}

// ── Hero Animation ────────────────────────────────────────────────────────

function initHeroAnimation() {
  // Animate hero elements
  const heroElements = document.querySelectorAll('.hero-animate');
  heroElements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 200 + i * 150);
  });
}

// ── Apply URL Params (for pre-filtered products page) ─────────────────────

function applyUrlCategory() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat) {
    const chip = document.querySelector(`.filter-chip[data-category="${cat}"]`);
    if (chip) {
      setTimeout(() => chip.click(), 100);
    }
  }
}

// ── Init ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  renderTrending();
  renderNewArrivals();
  renderCategories();
  renderTestimonials();
  initStats();
  initHeroAnimation();
  applyUrlCategory();
});
