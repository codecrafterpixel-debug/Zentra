/**
 * ZENTRA — Authentication System
 * Manages admin and user sessions
 */

const ADMIN_CREDS = {
  id: "admin",
  email: "zantac.in",
  password: "jabarchand$123",
  name: "Zentra Admin",
  role: "admin",
};

const Auth = {
  /**
   * Login — checks admin first, then registered users
   */
  async login(email, password) {
    if (!email || !password) {
      return { success: false, error: "Please enter your email and password." };
    }

    const normalizedInput = email.trim().toLowerCase();

    // Admin login
    if (
      normalizedInput === ADMIN_CREDS.email &&
      password === ADMIN_CREDS.password
    ) {
      const session = {
        id: ADMIN_CREDS.id,
        name: ADMIN_CREDS.name,
        email: ADMIN_CREDS.email,
        role: "admin",
      };
      Storage.setSession(session);
      return { success: true, user: session };
    }

    // Regular user login — search by email or phone number
    let users = Storage.getUsers();
    let user = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === normalizedInput) ||
        (u.phone && u.phone.replace(/\s/g, "") === normalizedInput),
    );

    if (!user) {
      users = await Storage.getUsersAsync();
      user = users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === normalizedInput) ||
          (u.phone && u.phone.replace(/\s/g, "") === normalizedInput),
      );
    }

    if (!user) {
      return {
        success: false,
        error:
          "No account found with this email or phone number. Please sign up first!",
      };
    }
    if (user.password !== password) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: "user",
    };
    Storage.setSession(session);
    return { success: true, user: session };
  },

  /**
   * Register a new user account
   */
  async register(name, email, phone, password) {
    name = name?.trim();
    email = email?.trim().toLowerCase();
    phone = phone?.trim().replace(/\s/g, "");
    password = password?.trim();

    if (!name || !email || !phone || !password) {
      return { success: false, error: "All fields are required." };
    }

    if (name.length < 2) {
      return { success: false, error: "Please enter your full name." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return {
        success: false,
        error: "Please enter a valid 10-digit Indian mobile number.",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long.",
      };
    }

    if (email === ADMIN_CREDS.email) {
      return { success: false, error: "This email address is not available." };
    }

    await Storage.getUsersAsync();
    if (Storage.getUserByEmail(email)) {
      return {
        success: false,
        error: "An account with this email already exists. Please login.",
      };
    }

    const user = await Storage.addUser({ name, email, phone, password });
    if (!user) {
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }

    return { success: true, user };
  },

  /**
   * Log out the current user
   */
  logout() {
    Storage.clearSession();
  },

  /**
   * Get current session data
   */
  getSession() {
    return Storage.getSession();
  },

  /**
   * Check if anyone is logged in
   */
  isLoggedIn() {
    return !!Storage.getSession();
  },

  /**
   * Check if current user is admin
   */
  isAdmin() {
    const s = Storage.getSession();
    return s?.role === "admin";
  },

  /**
   * Redirect to auth page if not logged in
   */
  requireAuth(redirectTo = "auth.html") {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },

  /**
   * Redirect to home if not admin
   */
  requireAdmin(redirectTo = "index.html") {
    if (!this.isAdmin()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },
};
