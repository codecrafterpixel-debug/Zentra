/**
 * ZENTRA — Global App Logic
 * Theme, Navbar, Toast, Modal utilities
 */

// ── Theme ─────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  Storage.setTheme(theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.innerHTML = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
  const theme = Storage.getTheme();
  applyTheme(theme);
}

function toggleTheme() {
  const current = Storage.getTheme();
  applyTheme(current === "dark" ? "light" : "dark");
}

// ── Navbar ────────────────────────────────────────────────────────────────

function buildNav() {
  const session = Auth.getSession();
  const navActions = document.getElementById("nav-actions");
  if (!navActions) return;

  // Admin pill button
  const adminLink = document.getElementById("nav-admin-link");
  if (adminLink) {
    adminLink.style.display = session?.role === "admin" ? "" : "none";
  }

  if (!session) {
    navActions.innerHTML = `
      <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
        ${Storage.getTheme() === "dark" ? "☀️" : "🌙"}
      </button>
      <a href="auth.html" class="btn btn-secondary btn-sm">Login</a>
      <a href="auth.html#register" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  } else {
    const initial = session.name.charAt(0).toUpperCase();
    navActions.innerHTML = `
      <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
        ${Storage.getTheme() === "dark" ? "☀️" : "🌙"}
      </button>
      <div class="nav-dropdown" id="user-dropdown">
        <button class="nav-user-btn" onclick="toggleDropdown()">
          <div class="nav-avatar">${initial}</div>
          <span>${session.name.split(" ")[0]}</span>
          <span>▾</span>
        </button>
        <div class="nav-dropdown-menu" id="dropdown-menu">
          ${
            session.role === "admin"
              ? `<a href="admin.html" class="nav-dropdown-item">
                <span>🛡️</span> Admin Panel
               </a>`
              : `<a href="user-panel.html" class="nav-dropdown-item">
                <span>👤</span> My Panel
               </a>`
          }
          <div class="nav-dropdown-divider"></div>
          <button class="nav-dropdown-item danger" onclick="handleLogout()">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>
    `;
  }
}

function toggleDropdown() {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) dropdown.classList.toggle("open");
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
  }
});

function handleLogout() {
  Auth.logout();
  showToast("Logged out successfully. See you soon!", "info");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}

// ── Active Nav Link ────────────────────────────────────────────────────────

function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link, .mobile-nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage || (href === "index.html" && currentPage === "")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// ── Mobile Nav ─────────────────────────────────────────────────────────────

function initMobileNav() {
  const hamburger = document.getElementById("nav-hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    const isOpen = mobileMenu.classList.toggle("open");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  // Close on link click
  mobileMenu.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("click", () => {
      hamburger.classList.remove("open");
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
}

// ── Scroll Effects ─────────────────────────────────────────────────────────

function refreshSharedViews() {
  if (typeof renderTrending === "function") renderTrending();
  if (typeof renderNewArrivals === "function") renderNewArrivals();
  if (typeof renderCategories === "function") renderCategories();
  if (
    typeof renderProductGrid === "function" &&
    document.getElementById("products-grid")
  ) {
    const productsGrid = document.getElementById("products-grid");
    const countLabel = document.getElementById("products-count");
    const currentCategory =
      document.querySelector(".filter-chip[data-category].active")?.dataset
        .category || "all";
    let products = Storage.getProducts();
    if (currentCategory !== "all")
      products = products.filter((p) => p.category === currentCategory);
    const searchInput = document.getElementById("product-search");
    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q),
      );
    }
    renderProductGrid("products-grid", products);
    if (countLabel)
      countLabel.textContent = `${products.length} product${products.length !== 1 ? "s" : ""}`;
  }
}

function initScrollEffects() {
  const navbar = document.querySelector(".navbar");

  window.addEventListener(
    "scroll",
    () => {
      if (navbar) {
        navbar.classList.toggle("scrolled", window.scrollY > 30);
      }
    },
    { passive: true },
  );

  // Scroll reveal
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// ── Toast Notifications ────────────────────────────────────────────────────

function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || "💬"}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Modal Utilities ────────────────────────────────────────────────────────

function openModal(htmlContent, options = {}) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "global-modal-overlay";
  overlay.innerHTML = `
    <div class="modal ${options.size ? "modal-" + options.size : ""}" id="global-modal">
      ${htmlContent}
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const overlay = document.getElementById("global-modal-overlay");
  if (overlay) {
    overlay.remove();
    document.body.style.overflow = "";
  }
}

// ── Confirm Dialog ────────────────────────────────────────────────────────

function confirmDialog(title, desc, onConfirm, danger = true) {
  openModal(
    `
    <div class="confirm-dialog">
      <span class="confirm-dialog-icon">${danger ? "⚠️" : "❓"}</span>
      <div class="confirm-dialog-title">${title}</div>
      <div class="confirm-dialog-desc">${desc}</div>
      <div class="confirm-dialog-btns">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn ${danger ? "btn-danger" : "btn-primary"}" id="confirm-action-btn">Confirm</button>
      </div>
    </div>
  `,
    { size: "sm" },
  );

  document
    .getElementById("confirm-action-btn")
    .addEventListener("click", () => {
      closeModal();
      onConfirm();
    });
}

// ── Image File to Base64 ──────────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleImageFiles(files) {
  const base64Images = [];
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) continue;
    const b64 = await fileToBase64(file);
    base64Images.push(b64);
  }
  return base64Images;
}

// ── Format Helpers ────────────────────────────────────────────────────────

function formatPrice(price) {
  return "₹" + Number(price).toLocaleString("en-IN");
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function categoryLabel(cat) {
  const labels = {
    graphic: "Graphic Tees",
    oversized: "Oversized",
    basics: "Basics",
    polo: "Polo",
    custom: "Custom Print",
  };
  return labels[cat] || cat;
}

function statusBadgeHtml(status) {
  return `<span class="badge badge-status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
}

// ── Init ──────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  // Seed sample data if first visit
  Storage.seedIfEmpty();

  initTheme();
  buildNav();
  setActiveNav();
  initMobileNav();
  initScrollEffects();

  try {
    await Storage.getProductsAsync();
    await Storage.getUsersAsync();
    await Storage.getRequestsAsync();
    refreshSharedViews();
  } catch (e) {
    console.warn("Failed to hydrate shared data from backend:", e);
  }

  window.addEventListener("zentra:products-changed", () => {
    refreshSharedViews();
  });
});
