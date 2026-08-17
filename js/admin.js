/**
 * ZENTRA — Admin Panel JS
 * Product CRUD, User Requests management, Users list
 */

// ── Admin Auth Gate ────────────────────────────────────────────────────────

function checkAdminAuth() {
  if (!Auth.requireAdmin("index.html")) return false;
  return true;
}

// ── Dashboard Stats ────────────────────────────────────────────────────────

function renderDashboardStats() {
  const products = Storage.getProducts();
  const requests = Storage.getRequests();
  const users = Storage.getUsers();
  const pending = requests.filter((r) => r.status === "pending").length;

  const statsEl = document.getElementById("admin-stats");
  if (!statsEl) return;

  statsEl.innerHTML = `
    <div class="stat-card">
      <span class="stat-card-icon">🛍️</span>
      <div class="stat-card-value">${products.length}</div>
      <div class="stat-card-label">Total Products</div>
    </div>
    <div class="stat-card">
      <span class="stat-card-icon">📦</span>
      <div class="stat-card-value">${requests.length}</div>
      <div class="stat-card-label">Total Requests</div>
    </div>
    <div class="stat-card">
      <span class="stat-card-icon">⏳</span>
      <div class="stat-card-value">${pending}</div>
      <div class="stat-card-label">Pending Requests</div>
    </div>
    <div class="stat-card">
      <span class="stat-card-icon">👥</span>
      <div class="stat-card-value">${users.length}</div>
      <div class="stat-card-label">Registered Users</div>
    </div>
  `;
}

// ── Tab Navigation ────────────────────────────────────────────────────────

let currentAdminTab = "dashboard";

function switchAdminTab(tab) {
  currentAdminTab = tab;
  document.querySelectorAll(".sidebar-nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });

  document.querySelectorAll(".admin-tab-content").forEach((el) => {
    el.classList.toggle("hidden", el.id !== `tab-${tab}`);
  });

  // Render specific tab
  if (tab === "dashboard") renderDashboardStats();
  if (tab === "products") renderAdminProducts();
  if (tab === "requests") renderAdminRequests();
  if (tab === "users") renderAdminUsers();
}

// ── Product Management ────────────────────────────────────────────────────

let editingProductId = null;
let currentProductImages = [];

function renderAdminProducts() {
  const container = document.getElementById("admin-products-table-body");
  if (!container) return;

  const products = Storage.getProducts();

  if (products.length === 0) {
    container.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <span class="empty-state-icon">🛍️</span>
          <div class="empty-state-title">No products yet</div>
          <div class="empty-state-desc">Add your first product using the button above.</div>
        </div>
      </td></tr>
    `;
    return;
  }

  container.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td data-label="Image">
        <img class="table-img" src="${p.images?.[0] || ""}" alt="${p.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect width=%2240%22 height=%2240%22 fill=%22%23222%22/></svg>'"/>
      </td>
      <td data-label="Name"><strong>${p.name}</strong></td>
      <td data-label="Category"><span class="filter-chip" style="cursor:default">${categoryLabel(p.category)}</span></td>
      <td data-label="Price"><strong>${formatPrice(p.price)}</strong></td>
      <td data-label="Stock">
        <span class="badge ${p.stock === "instock" ? "badge-instock" : "badge-outofstock"}">
          ${p.stock === "instock" ? "● In Stock" : "○ Out of Stock"}
        </span>
      </td>
      <td data-label="Flags">
        ${p.trending ? '<span class="badge badge-trending">🔥</span>' : ""}
        ${p.newArrival ? '<span class="badge badge-new">✨</span>' : ""}
      </td>
      <td data-label="Actions">
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-ghost btn-icon btn-icon-sm" onclick="openProductForm('${p.id}')" title="Edit">✏️</button>
          <button class="btn btn-danger btn-icon btn-icon-sm" onclick="deleteProduct('${p.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
}

function openProductForm(productId = null) {
  editingProductId = productId;
  currentProductImages = [];

  const product = productId ? Storage.getProductById(productId) : null;
  if (product) currentProductImages = [...(product.images || [])];

  const title = product ? "Edit Product" : "Add New Product";

  openModal(
    `
    <div class="modal-header">
      <div class="modal-title">${title}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="product-form" onsubmit="submitProductForm(event)">
        <div class="grid-2" style="gap:1rem">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Product Name <span class="required">*</span></label>
            <input class="form-input" id="f-name" type="text" placeholder="e.g. Street Noise Oversized Tee" value="${product?.name || ""}" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Category <span class="required">*</span></label>
            <select class="form-select" id="f-category" required>
              <option value="">Select category</option>
              <option value="graphic"   ${product?.category === "graphic" ? "selected" : ""}>Graphic Tees</option>
              <option value="oversized" ${product?.category === "oversized" ? "selected" : ""}>Oversized</option>
              <option value="basics"    ${product?.category === "basics" ? "selected" : ""}>Basics & Classics</option>
              <option value="polo"      ${product?.category === "polo" ? "selected" : ""}>Polo T-Shirts</option>
              <option value="custom"    ${product?.category === "custom" ? "selected" : ""}>Custom Print</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Stock Status <span class="required">*</span></label>
            <select class="form-select" id="f-stock" required>
              <option value="instock"    ${product?.stock !== "outofstock" ? "selected" : ""}>In Stock</option>
              <option value="outofstock" ${product?.stock === "outofstock" ? "selected" : ""}>Out of Stock</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Price (₹) <span class="required">*</span></label>
            <input class="form-input" id="f-price" type="number" min="0" placeholder="699" value="${product?.price || ""}" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Original Price (₹) <span class="form-hint">for discount display</span></label>
            <input class="form-input" id="f-original-price" type="number" min="0" placeholder="999" value="${product?.originalPrice || ""}"/>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Description <span class="required">*</span></label>
            <textarea class="form-textarea" id="f-description" placeholder="Describe the product..." required>${product?.description || ""}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Sizes (comma separated)</label>
            <input class="form-input" id="f-sizes" type="text" placeholder="S, M, L, XL, XXL" value="${(product?.sizes || ["S", "M", "L", "XL", "XXL"]).join(", ")}"/>
          </div>
          <div class="form-group">
            <label class="form-label">Tags (comma separated)</label>
            <input class="form-input" id="f-tags" type="text" placeholder="oversized, streetwear" value="${(product?.tags || []).join(", ")}"/>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <div style="display:flex;gap:2rem">
              <label class="toggle-switch">
                <input type="checkbox" id="f-trending" ${product?.trending ? "checked" : ""}/>
                <div class="toggle-track"></div>
                <span class="toggle-label">Mark as Trending 🔥</span>
              </label>
              <label class="toggle-switch">
                <input type="checkbox" id="f-new-arrival" ${product?.newArrival ? "checked" : ""}/>
                <div class="toggle-track"></div>
                <span class="toggle-label">Mark as New Arrival ✨</span>
              </label>
            </div>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Product Images</label>
            <div class="file-upload-area" id="file-upload-area">
              <input type="file" id="f-images" accept="image/*" multiple onchange="previewProductImages(this)"/>
              <span class="file-upload-icon">📸</span>
              <div class="file-upload-text">
                <strong>Click to upload</strong> or drag & drop<br/>
                <span style="font-size:0.75rem">PNG, JPG, WEBP • Multiple allowed</span>
              </div>
            </div>
            <div class="image-previews" id="image-previews"></div>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitProductForm(event)" id="save-product-btn">
        ${product ? "💾 Update Product" : "➕ Add Product"}
      </button>
    </div>
  `,
    { size: "lg" },
  );

  // Show existing images
  renderImagePreviews();

  // Drag & drop
  const area = document.getElementById("file-upload-area");
  area.addEventListener("dragover", (e) => {
    e.preventDefault();
    area.classList.add("dragover");
  });
  area.addEventListener("dragleave", () => area.classList.remove("dragover"));
  area.addEventListener("drop", async (e) => {
    e.preventDefault();
    area.classList.remove("dragover");
    const newImgs = await handleImageFiles(e.dataTransfer.files);
    currentProductImages.push(...newImgs);
    renderImagePreviews();
  });
}

async function previewProductImages(input) {
  const newImgs = await handleImageFiles(input.files);
  currentProductImages.push(...newImgs);
  renderImagePreviews();
}

function renderImagePreviews() {
  const container = document.getElementById("image-previews");
  if (!container) return;

  container.innerHTML = currentProductImages
    .map(
      (src, i) => `
    <div class="image-preview">
      <img src="${src}" alt="Preview ${i + 1}"/>
      <button class="image-preview-remove" onclick="removeProductImage(${i})">✕</button>
    </div>
  `,
    )
    .join("");
}

function removeProductImage(index) {
  currentProductImages.splice(index, 1);
  renderImagePreviews();
}

async function submitProductForm(e) {
  if (e) e.preventDefault();

  const name = document.getElementById("f-name")?.value?.trim();
  const category = document.getElementById("f-category")?.value;
  const stock = document.getElementById("f-stock")?.value;
  const price = parseFloat(document.getElementById("f-price")?.value);
  const origPrice =
    parseFloat(document.getElementById("f-original-price")?.value) || 0;
  const description = document.getElementById("f-description")?.value?.trim();
  const sizesRaw = document.getElementById("f-sizes")?.value || "";
  const tagsRaw = document.getElementById("f-tags")?.value || "";
  const trending = document.getElementById("f-trending")?.checked;
  const newArrival = document.getElementById("f-new-arrival")?.checked;

  if (!name || !category || !price || !description) {
    showToast("Please fill in all required fields.", "error");
    return;
  }

  const sizes = sizesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const productData = {
    name,
    category,
    stock,
    description,
    price,
    originalPrice: origPrice > price ? origPrice : 0,
    sizes,
    tags,
    trending,
    newArrival,
    images: currentProductImages,
  };

  const btn = document.getElementById("save-product-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Saving...";
  }

  if (editingProductId) {
    await Storage.updateProduct(editingProductId, productData);
    showToast(`"${name}" updated successfully! ✅`, "success");
  } else {
    await Storage.addProduct(productData);
    showToast(`"${name}" added to the collection! ✅`, "success");
  }

  closeModal();
  renderAdminProducts();
  renderDashboardStats();
}

function deleteProduct(productId) {
  const product = Storage.getProductById(productId);
  if (!product) return;

  confirmDialog(
    "Delete Product",
    `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
    async () => {
      await Storage.deleteProduct(productId);
      showToast(`"${product.name}" deleted.`, "warning");
      renderAdminProducts();
      renderDashboardStats();
    },
    true,
  );
}

// ── User Requests ─────────────────────────────────────────────────────────

function renderAdminRequests() {
  const container = document.getElementById("admin-requests-body");
  if (!container) return;

  const requests = Storage.getRequests();

  if (requests.length === 0) {
    container.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <span class="empty-state-icon">📭</span>
          <div class="empty-state-title">No requests yet</div>
          <div class="empty-state-desc">User product requests will appear here.</div>
        </div>
      </td></tr>
    `;
    return;
  }

  container.innerHTML = requests
    .map(
      (r) => `
    <tr>
      <td data-label="User">
        <div style="font-weight:600;font-size:0.875rem">${r.userName}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${r.userEmail || ""}</div>
      </td>
      <td data-label="Phone">
        <div style="font-size:0.8rem;color:var(--text-muted)">${r.userPhone}</div>
      </td>
      <td data-label="Product Wanted">
        <div style="font-weight:600;font-size:0.875rem">${r.productName}</div>
        ${r.size ? `<div style="font-size:0.75rem;color:var(--text-muted)">Size: ${r.size} • Qty: ${r.quantity || 1}</div>` : ""}
      </td>
      <td data-label="Delivery Address" style="max-width:180px">
        <div style="font-size:0.75rem;color:var(--text-muted);line-height:1.4">
          ${r.address ? `${r.address.line1}, ${r.address.city}, ${r.address.state} - ${r.address.pincode}` : "—"}
        </div>
      </td>
      <td data-label="Status">${statusBadgeHtml(r.status)}</td>
      <td data-label="Date" style="font-size:0.75rem;color:var(--text-muted)">${formatDate(r.createdAt)}</td>
      <td data-label="Update Status">
        <select class="form-select" style="padding:0.3rem 0.6rem;font-size:0.78rem;width:auto"
          onchange="updateRequestStatus('${r.id}', this.value)">
          <option value="pending"   ${r.status === "pending" ? "selected" : ""}>Pending</option>
          <option value="reviewed"  ${r.status === "reviewed" ? "selected" : ""}>Reviewed</option>
          <option value="confirmed" ${r.status === "confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="rejected"  ${r.status === "rejected" ? "selected" : ""}>Rejected</option>
        </select>
      </td>
    </tr>
  `,
    )
    .join("");
}

async function updateRequestStatus(requestId, newStatus) {
  const updated = await Storage.updateRequest(requestId, { status: newStatus });
  if (updated) {
    showToast(`Request status updated to "${newStatus}".`, "success");
  } else {
    showToast("Unable to update request status.", "error");
  }
  renderDashboardStats();
  renderAdminRequests();
}

// ── Users List ────────────────────────────────────────────────────────────

function renderAdminUsers() {
  const container = document.getElementById("admin-users-body");
  if (!container) return;

  const users = Storage.getUsers();

  if (users.length === 0) {
    container.innerHTML = `
      <tr><td colspan="4">
        <div class="empty-state">
          <span class="empty-state-icon">👥</span>
          <div class="empty-state-title">No registered users yet</div>
          <div class="empty-state-desc">Users who sign up will appear here.</div>
        </div>
      </td></tr>
    `;
    return;
  }

  container.innerHTML = users
    .map(
      (u) => `
    <tr>
      <td data-label="User">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <div class="testimonial-avatar" style="width:36px;height:36px;font-size:0.8rem">${u.name[0]}</div>
          <div>
            <div style="font-weight:600;font-size:0.875rem">${u.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${u.email}</div>
          </div>
        </div>
      </td>
      <td data-label="Phone" style="font-size:0.875rem">📱 ${u.phone}</td>
      <td data-label="Status">
        <span class="badge badge-instock">Active</span>
      </td>
      <td data-label="Joined" style="font-size:0.75rem;color:var(--text-muted)">${formatDate(u.createdAt)}</td>
    </tr>
  `,
    )
    .join("");
}

// ── Init ──────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("admin-panel")) return;
  if (!checkAdminAuth()) return;

  // Set admin name in sidebar
  const session = Auth.getSession();
  const adminNameEl = document.getElementById("admin-name");
  if (adminNameEl) adminNameEl.textContent = session.name;

  // Sidebar tab clicks
  document.querySelectorAll(".sidebar-nav-item[data-tab]").forEach((el) => {
    el.addEventListener("click", () => switchAdminTab(el.dataset.tab));
  });

  // Pre-load data from backend
  await Promise.all([
    Storage.getProductsAsync(),
    Storage.getRequestsAsync(),
    Storage.getUsersAsync()
  ]);

  // Start on dashboard
  switchAdminTab("dashboard");
});
