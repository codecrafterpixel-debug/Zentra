/**
 * ZENTRA — Products JS
 * Product card generation, grid rendering, filtering, detail modal
 */

// ── Product Card HTML ──────────────────────────────────────────────────────

function generateProductCard(product) {
  const image = (product.images && product.images.length > 0)
    ? product.images[0]
    : Storage._svg('#1a1a1a', '#2a2a2a', 'ZENTRA');

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return `
    <div class="product-card reveal" onclick="openProductDetail('${product.id}')">
      <div class="product-card-image img-zoom">
        <img src="${image}" alt="${product.name}" loading="lazy"/>
        <div class="product-badges">
          ${product.trending ? `<span class="badge badge-trending">🔥 Trending</span>` : ''}
          ${product.newArrival ? `<span class="badge badge-new">✨ New</span>` : ''}
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
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openProductDetail('${product.id}')">View</button>
        </div>
      </div>
    </div>
  `;
}

// ── Product Detail Modal ───────────────────────────────────────────────────

function openProductDetail(productId) {
  const product = Storage.getProductById(productId);
  if (!product) return;

  const session = Auth.getSession();
  const images = product.images && product.images.length > 0 ? product.images : [Storage._svg('#1a1a1a', '#2a2a2a', 'ZENTRA')];
  const discount = product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const thumbsHtml = images.map((img, i) => `
    <div class="product-modal-thumb ${i === 0 ? 'active' : ''}" onclick="switchModalImage(this, '${img}')">
      <img src="${img}" alt="View ${i + 1}"/>
    </div>
  `).join('');

  const sizesHtml = (product.sizes || ['S', 'M', 'L', 'XL', 'XXL'])
    .map((s) => `<span class="size-chip">${s}</span>`).join('');

  const requestBtnHtml = session
    ? session.role === 'admin'
      ? `<p class="text-muted text-sm">Logged in as Admin.</p>`
      : `<div style="display:flex; flex-direction:column; gap:0.5rem;">
           <button class="btn btn-primary w-full" onclick="window.location.href='upi_payment_machine.html?amount=${product.price}&note=Order: ${encodeURIComponent(product.name)}'">
             💳 Pay Online via UPI
           </button>
           <button class="btn btn-secondary w-full" onclick="closeModal(); openRequestForm('${product.name}')">
             📦 Request via WhatsApp
           </button>
         </div>`
    : `<a href="auth.html" class="btn btn-primary w-full">
         Login to Shop
       </a>`;

  openModal(`
    <div class="modal-header">
      <div class="modal-title">Product Details</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="product-modal-grid">
        <div class="product-modal-gallery">
          <img id="modal-main-img" class="product-modal-main-img" src="${images[0]}" alt="${product.name}"/>
          ${images.length > 1 ? `<div class="product-modal-thumbs">${thumbsHtml}</div>` : ''}
        </div>
        <div class="product-modal-info">
          <div>
            <div class="product-category-tag" style="margin-bottom:0.5rem">${categoryLabel(product.category)}</div>
            <h2 style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:700;margin-bottom:0.75rem">${product.name}</h2>
            <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem">
              <span class="price-current" style="font-size:1.5rem">${formatPrice(product.price)}</span>
              ${product.originalPrice > product.price ? `<span class="price-original">${formatPrice(product.originalPrice)}</span>` : ''}
              ${discount > 0 ? `<span class="price-discount">${discount}% OFF</span>` : ''}
            </div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
              ${product.trending ? `<span class="badge badge-trending">🔥 Trending</span>` : ''}
              ${product.newArrival ? `<span class="badge badge-new">✨ New Arrival</span>` : ''}
              <span class="badge ${product.stock === 'instock' ? 'badge-instock' : 'badge-outofstock'}">
                ${product.stock === 'instock' ? '● In Stock' : '○ Out of Stock'}
              </span>
            </div>
          </div>
          <div>
            <div class="form-label" style="margin-bottom:0.5rem">Description</div>
            <p style="font-size:0.9rem;color:var(--text-2);line-height:1.7">${product.description}</p>
          </div>
          <div>
            <div class="form-label" style="margin-bottom:0.5rem">Available Sizes</div>
            <div class="product-sizes">${sizesHtml}</div>
          </div>
          ${product.tags && product.tags.length > 0 ? `
            <div>
              <div class="form-label" style="margin-bottom:0.5rem">Tags</div>
              <div style="display:flex;flex-wrap:wrap;gap:0.4rem">
                ${product.tags.map((t) => `<span class="filter-chip" style="cursor:default">#${t}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          <div style="margin-top:auto;padding-top:1rem">
            ${requestBtnHtml}
          </div>
        </div>
      </div>
    </div>
  `, { size: 'lg' });
}

function switchModalImage(thumb, imgSrc) {
  document.getElementById('modal-main-img').src = imgSrc;
  document.querySelectorAll('.product-modal-thumb').forEach((t) => t.classList.remove('active'));
  thumb.classList.add('active');
}

// ── Open Request Form (user shortcut) ─────────────────────────────────────

function openRequestForm(productName) {
  if (!Auth.requireAuth()) return;
  // Navigate to user panel with pre-filled product name
  window.location.href = `user-panel.html?product=${encodeURIComponent(productName)}`;
}

// ── Render Product Grid ────────────────────────────────────────────────────

function renderProductGrid(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <span class="empty-state-icon">🔍</span>
        <div class="empty-state-title">No products found</div>
        <div class="empty-state-desc">Try a different search or filter.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(generateProductCard).join('');

  // Trigger reveal
  setTimeout(() => {
    container.querySelectorAll('.reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 60);
    });
  }, 50);
}

// ── Products Page Init ─────────────────────────────────────────────────────

function initProductsPage() {
  if (!document.getElementById('products-grid')) return;

  let currentCategory = 'all';
  let searchQuery = '';

  function filterAndRender() {
    let products = Storage.getProducts();

    if (currentCategory !== 'all') {
      products = products.filter((p) => p.category === currentCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
      );
    }

    renderProductGrid('products-grid', products);
    document.getElementById('products-count').textContent =
      `${products.length} product${products.length !== 1 ? 's' : ''}`;
  }

  // Filter chips
  document.querySelectorAll('.filter-chip[data-category]').forEach((chip) => {
    chip.addEventListener('click', () => {
      currentCategory = chip.dataset.category;
      document.querySelectorAll('.filter-chip[data-category]').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      filterAndRender();
    });
  });

  // Search
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      filterAndRender();
    });
  }

  filterAndRender();
}

document.addEventListener('DOMContentLoaded', initProductsPage);
