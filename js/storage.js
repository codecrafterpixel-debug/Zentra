/**
 * ZENTRA — Storage Management Layer
 * All data persistence via localStorage
 */

const STORAGE_KEYS = {
  PRODUCTS: "zentra_products",
  USERS: "zentra_users",
  REQUESTS: "zentra_requests",
  SESSION: "zentra_session",
  THEME: "zentra_theme",
  SEEDED: "zentra_seeded",
};

const Storage = {
  apiBaseUrl:
    (typeof window !== "undefined" && window.ZENTRA_CONFIG?.apiBaseUrl) ||
    "https://zentra-clothing-store.vercel.app/api",
  backendEnabled: true,

  async pingBackend() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/health`);
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async _loadProductsFromBackend() {
    try {
      if (!(await this.pingBackend())) return null;
      const res = await fetch(`${this.apiBaseUrl}/products`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item) => this._normalizeProduct(item));
    } catch (e) {
      return null;
    }
  },

  async _syncProductsToBackend(products) {
    try {
      if (!(await this.pingBackend())) return false;
      const res = await fetch(`${this.apiBaseUrl}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products[0]),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async _loadUsersFromBackend() {
    try {
      if (!(await this.pingBackend())) return null;
      const res = await fetch(`${this.apiBaseUrl}/users`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item) => this._normalizeUser(item));
    } catch (e) {
      return null;
    }
  },

  async _loadRequestsFromBackend() {
    try {
      if (!(await this.pingBackend())) return null;
      const res = await fetch(`${this.apiBaseUrl}/requests`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item) => this._normalizeRequest(item));
    } catch (e) {
      return null;
    }
  },

  async _syncUserToBackend(user) {
    try {
      if (!(await this.pingBackend())) return false;
      const res = await fetch(`${this.apiBaseUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async _syncRequestToBackend(request) {
    try {
      if (!(await this.pingBackend())) return false;
      const res = await fetch(`${this.apiBaseUrl}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async _syncRequestUpdateToBackend(request) {
    try {
      if (!(await this.pingBackend())) return false;
      const res = await fetch(`${this.apiBaseUrl}/requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  _normalizeProduct(raw) {
    return {
      ...raw,
      id: raw.id,
      name: raw.name,
      category: raw.category,
      description: raw.description,
      price: raw.price,
      originalPrice: raw.originalPrice ?? raw.original_price ?? 0,
      stock: raw.stock,
      trending: raw.trending,
      newArrival: raw.newArrival ?? raw.new_arrival ?? false,
      images: raw.images || [],
      tags: raw.tags || [],
      sizes: raw.sizes || [],
      createdAt: raw.createdAt ?? raw.created_at ?? Date.now(),
      updatedAt: raw.updatedAt ?? raw.updated_at ?? Date.now(),
    };
  },

  _normalizeUser(raw) {
    return {
      ...raw,
      id: raw.id,
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      password: raw.password,
      createdAt: raw.createdAt ?? raw.created_at ?? Date.now(),
      updatedAt: raw.updatedAt ?? raw.updated_at ?? Date.now(),
    };
  },

  _normalizeRequest(raw) {
    return {
      ...raw,
      id: raw.id,
      userId: raw.userId ?? raw.user_id,
      userName: raw.userName ?? raw.user_name,
      userEmail: raw.userEmail ?? raw.user_email ?? "",
      userPhone: raw.userPhone ?? raw.user_phone ?? "",
      productName: raw.productName ?? raw.product_name,
      description: raw.description,
      size: raw.size,
      quantity: raw.quantity,
      address: raw.address,
      status: raw.status,
      adminNotes: raw.adminNotes ?? raw.admin_notes ?? "",
      createdAt: raw.createdAt ?? raw.created_at ?? Date.now(),
      updatedAt: raw.updatedAt ?? raw.updated_at ?? Date.now(),
    };
  },

  // ── Generic ──────────────────────────────────────────────────────────────
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error("Storage.get:", e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Storage.set:", e);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  },

  // ── Products ─────────────────────────────────────────────────────────────
  getProducts() {
    return this.get(STORAGE_KEYS.PRODUCTS) || [];
  },

  async getProductsAsync() {
    const backendProducts = await this._loadProductsFromBackend();
    if (backendProducts) {
      this.saveProducts(backendProducts);
      return backendProducts;
    }
    return this.getProducts();
  },

  saveProducts(products) {
    return this.set(STORAGE_KEYS.PRODUCTS, products);
  },

  _isAdminSession() {
    const session =
      typeof Auth !== "undefined" && Auth?.getSession
        ? Auth.getSession()
        : null;
    return session?.role === "admin";
  },

  _emitProductsChanged() {
    try {
      if (
        typeof window !== "undefined" &&
        typeof window.dispatchEvent === "function"
      ) {
        const event =
          typeof CustomEvent === "function"
            ? new CustomEvent("zentra:products-changed")
            : { type: "zentra:products-changed" };
        window.dispatchEvent(event);
      }
    } catch (e) {
      console.warn("Storage._emitProductsChanged:", e);
    }
  },

  async addProduct(data) {
    if (!this._isAdminSession()) return null;

    const products = this.getProducts();
    const product = {
      ...data,
      id: this.uuid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    products.unshift(product);
    this.saveProducts(products);

    try {
      const backendOk = await this._syncProductsToBackend([product]);
      if (backendOk) {
        this._emitProductsChanged();
        return product;
      }
    } catch (e) {
      console.warn("Storage.addProduct backend sync failed:", e);
    }

    this._emitProductsChanged();
    return product;
  },

  async updateProduct(id, updates) {
    if (!this._isAdminSession()) return null;

    const products = this.getProducts();
    const i = products.findIndex((p) => p.id === id);
    if (i === -1) return null;
    products[i] = { ...products[i], ...updates, updatedAt: Date.now() };
    this.saveProducts(products);

    try {
      const res = await fetch(`${this.apiBaseUrl}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products[i]),
      });
      if (res.ok) {
        this._emitProductsChanged();
        return products[i];
      }
    } catch (e) {
      console.warn("Storage.updateProduct backend sync failed:", e);
    }

    this._emitProductsChanged();
    return products[i];
  },

  async deleteProduct(id) {
    if (!this._isAdminSession()) return false;

    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) return false;
    this.saveProducts(filtered);

    try {
      const res = await fetch(`${this.apiBaseUrl}/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        this._emitProductsChanged();
        return true;
      }
    } catch (e) {
      console.warn("Storage.deleteProduct backend sync failed:", e);
    }

    this._emitProductsChanged();
    return true;
  },

  getProductById(id) {
    return this.getProducts().find((p) => p.id === id) || null;
  },

  getTrending() {
    return this.getProducts().filter((p) => p.trending === true);
  },

  getNewArrivals() {
    return this.getProducts().filter((p) => p.newArrival === true);
  },

  getByCategory(cat) {
    return this.getProducts().filter((p) => p.category === cat);
  },

  // ── Users ────────────────────────────────────────────────────────────────
  getUsers() {
    return this.get(STORAGE_KEYS.USERS) || [];
  },

  async getUsersAsync() {
    const backendUsers = await this._loadUsersFromBackend();
    if (backendUsers) {
      this.saveUsers(backendUsers);
      return backendUsers;
    }
    return this.getUsers();
  },

  saveUsers(users) {
    return this.set(STORAGE_KEYS.USERS, users);
  },

  async addUser(data) {
    const users = this.getUsers();
    if (users.find((u) => u.email === data.email)) return null;
    const user = { ...data, id: this.uuid(), createdAt: Date.now() };
    users.push(user);
    this.saveUsers(users);
    try {
      await this._syncUserToBackend(user);
    } catch (e) {
      console.warn("Storage.addUser backend sync failed:", e);
    }
    return user;
  },

  getUserByEmail(email) {
    return this.getUsers().find((u) => u.email === email) || null;
  },

  getUserById(id) {
    return this.getUsers().find((u) => u.id === id) || null;
  },

  // ── Requests ─────────────────────────────────────────────────────────────
  getRequests() {
    return this.get(STORAGE_KEYS.REQUESTS) || [];
  },

  async getRequestsAsync() {
    const backendRequests = await this._loadRequestsFromBackend();
    if (backendRequests) {
      this.saveRequests(backendRequests);
      return backendRequests;
    }
    return this.getRequests();
  },

  saveRequests(requests) {
    return this.set(STORAGE_KEYS.REQUESTS, requests);
  },

  async addRequest(data) {
    const requests = this.getRequests();
    const request = {
      ...data,
      id: this.uuid(),
      status: "pending",
      adminNotes: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    requests.unshift(request);
    this.saveRequests(requests);
    try {
      await this._syncRequestToBackend(request);
    } catch (e) {
      console.warn("Storage.addRequest backend sync failed:", e);
    }
    return request;
  },

  async updateRequest(id, updates) {
    const requests = this.getRequests();
    const i = requests.findIndex((r) => r.id === id);
    if (i === -1) return null;
    requests[i] = { ...requests[i], ...updates, updatedAt: Date.now() };
    this.saveRequests(requests);
    try {
      await this._syncRequestUpdateToBackend(requests[i]);
    } catch (e) {
      console.warn("Storage.updateRequest backend sync failed:", e);
    }
    return requests[i];
  },

  getRequestsByUserId(userId) {
    return this.getRequests().filter((r) => r.userId === userId);
  },

  // ── Session ───────────────────────────────────────────────────────────────
  getSession() {
    return this.get(STORAGE_KEYS.SESSION);
  },

  setSession(data) {
    return this.set(STORAGE_KEYS.SESSION, data);
  },

  clearSession() {
    this.remove(STORAGE_KEYS.SESSION);
  },

  // ── Theme ─────────────────────────────────────────────────────────────────
  getTheme() {
    return this.get(STORAGE_KEYS.THEME) || "dark";
  },

  setTheme(theme) {
    return this.set(STORAGE_KEYS.THEME, theme);
  },

  // ── SVG Placeholder ───────────────────────────────────────────────────────
  _svg(c1, c2, label) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
        <linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(200,169,110,0.08)"/>
          <stop offset="100%" stop-color="rgba(200,169,110,0)"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#g)"/>
      <rect width="400" height="500" fill="url(#g2)"/>
      <circle cx="320" cy="80" r="60" fill="rgba(255,255,255,0.04)"/>
      <circle cx="60" cy="400" r="80" fill="rgba(255,255,255,0.03)"/>
      <rect x="130" y="170" width="140" height="160" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(200,169,110,0.2)" stroke-width="1"/>
      <text x="200" y="260" text-anchor="middle" font-family="Arial" font-size="11" fill="rgba(200,169,110,0.6)" letter-spacing="4">${label}</text>
      <text x="200" y="475" text-anchor="middle" font-family="Arial" font-size="10" fill="rgba(255,255,255,0.25)" letter-spacing="5">ZENTRA</text>
    </svg>`;
    return (
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)))
    );
  },

  // ── Seed Sample Data ──────────────────────────────────────────────────────
  seedIfEmpty() {
    if (this.get(STORAGE_KEYS.SEEDED)) return;

    const s = this._svg.bind(this);

    const samples = [
      {
        name: "Street Noise Oversized Tee",
        category: "oversized",
        description:
          "Bold streetwear energy meets premium comfort. Drop-shoulder silhouette crafted from 240GSM heavyweight cotton — pre-washed for that perfect broken-in feel. The tee that hits different every single time.",
        price: 699,
        originalPrice: 999,
        stock: "instock",
        trending: true,
        newArrival: true,
        images: [s("#1a1a2e", "#0d1117", "OVERSIZED")],
        tags: ["oversized", "streetwear", "trending"],
        sizes: ["S", "M", "L", "XL", "XXL"],
      },
      {
        name: "Anime Arc Graphic Tee",
        category: "graphic",
        description:
          "For the anime-obsessed. High-definition plastisol screen print guaranteed not to crack or fade after 100+ washes. Show your arc every day.",
        price: 599,
        originalPrice: 799,
        stock: "instock",
        trending: true,
        newArrival: false,
        images: [s("#0d0d0d", "#1a0800", "GRAPHIC")],
        tags: ["anime", "graphic", "streetwear"],
        sizes: ["S", "M", "L", "XL", "XXL"],
      },
      {
        name: "Aura Drop-Shoulder Tee",
        category: "oversized",
        description:
          "Channel your aura. Boxy drop-shoulder silhouette with subtle tonal embroidery on the chest. Premium feel, completely relaxed energy.",
        price: 749,
        originalPrice: 999,
        stock: "instock",
        trending: true,
        newArrival: true,
        images: [s("#0f1923", "#1a2d40", "AURA")],
        tags: ["oversized", "embroidery", "premium"],
        sizes: ["M", "L", "XL", "XXL"],
      },
      {
        name: "Clean Canvas Heavyweight Tee",
        category: "basics",
        description:
          "Your everyday essential. 240GSM pre-shrunk heavyweight cotton, available in 12 neutral colorways. Simple. Premium. Timeless.",
        price: 449,
        originalPrice: 599,
        stock: "instock",
        trending: false,
        newArrival: true,
        images: [s("#2a2420", "#1a1510", "BASICS")],
        tags: ["basics", "everyday", "heavyweight"],
        sizes: ["S", "M", "L", "XL", "XXL"],
      },
      {
        name: "Vintage Fade Crew",
        category: "graphic",
        description:
          "Distressed vintage aesthetics with a relaxed oversized fit. Acid-washed for that lived-in feel right from day one — no break-in period needed.",
        price: 799,
        originalPrice: 1099,
        stock: "instock",
        trending: false,
        newArrival: true,
        images: [s("#1a0f00", "#2d1800", "VINTAGE")],
        tags: ["vintage", "acid wash", "graphic"],
        sizes: ["M", "L", "XL", "XXL"],
      },
      {
        name: "Corporate Edge Polo",
        category: "polo",
        description:
          "Semi-formal, fully premium. Pique cotton polo with ribbed collar and cuffs — perfect for casual Fridays, team outings, or custom corporate branding.",
        price: 549,
        originalPrice: 749,
        stock: "instock",
        trending: false,
        newArrival: false,
        images: [s("#0a1628", "#0f2040", "POLO")],
        tags: ["polo", "semi-formal", "corporate"],
        sizes: ["S", "M", "L", "XL", "XXL"],
      },
      {
        name: "Shadow Bloom Custom Print",
        category: "custom",
        description:
          "Make it entirely yours. Upload any design, choose fabric weight, select your fit — we print it on demand with zero compromise on quality. Minimum order: 1 piece.",
        price: 899,
        originalPrice: 1199,
        stock: "instock",
        trending: true,
        newArrival: false,
        images: [s("#1a0a2e", "#2d0f50", "CUSTOM")],
        tags: ["custom", "print-on-demand", "personalized"],
        sizes: ["S", "M", "L", "XL", "XXL"],
      },
      {
        name: "Monochrome Minimal Tee",
        category: "graphic",
        description:
          "Less is more. A single minimalist graphic on premium off-white cotton. Understated but impactful — exactly like you.",
        price: 499,
        originalPrice: 699,
        stock: "outofstock",
        trending: false,
        newArrival: false,
        images: [s("#1c1c1c", "#282828", "MINIMAL")],
        tags: ["minimal", "aesthetic", "graphic"],
        sizes: ["S", "M", "L"],
      },
    ];

    samples.forEach((p) => this.addProduct(p));
    this.set(STORAGE_KEYS.SEEDED, true);
  },
};
