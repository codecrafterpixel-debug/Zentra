/**
 * ZENTRA — User Panel JS
 * Profile, Request submission with address, Request history
 */

// ── Init ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('user-panel')) return;
  if (!Auth.requireAuth('auth.html')) return;

  const session = Auth.getSession();

  // Populate profile
  const nameEl   = document.getElementById('up-name');
  const emailEl  = document.getElementById('up-email');
  const phoneEl  = document.getElementById('up-phone');
  const initialEl = document.getElementById('up-initial');

  if (nameEl)    nameEl.textContent  = session.name;
  if (emailEl)   emailEl.textContent = session.email;
  if (phoneEl)   phoneEl.textContent = session.phone || '—';
  if (initialEl) initialEl.textContent = session.name.charAt(0).toUpperCase();

  // Pre-fill product name from URL param
  const params = new URLSearchParams(window.location.search);
  const preProduct = params.get('product');
  if (preProduct) {
    const el = document.getElementById('r-product-name');
    if (el) el.value = decodeURIComponent(preProduct);
    // Switch to request tab
    switchUserTab('request');
  }

  // Sidebar tabs
  document.querySelectorAll('.sidebar-nav-item[data-tab]').forEach((el) => {
    el.addEventListener('click', () => switchUserTab(el.dataset.tab));
  });

  // Default tab
  switchUserTab('request');

  // Request form submit
  const form = document.getElementById('request-form');
  if (form) {
    form.addEventListener('submit', submitUserRequest);
  }

  renderUserRequests();
});

// ── Tab Switch ────────────────────────────────────────────────────────────

function switchUserTab(tab) {
  document.querySelectorAll('.sidebar-nav-item[data-tab]').forEach((el) => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  document.querySelectorAll('.user-tab-content').forEach((el) => {
    el.classList.toggle('hidden', el.id !== `utab-${tab}`);
  });

  if (tab === 'history') renderUserRequests();
}

// ── Submit Request ────────────────────────────────────────────────────────

async function submitUserRequest(e) {
  e.preventDefault();
  const session = Auth.getSession();

  const productName = document.getElementById('r-product-name')?.value?.trim();
  const description = document.getElementById('r-description')?.value?.trim();
  const size        = document.getElementById('r-size')?.value;
  const quantity    = parseInt(document.getElementById('r-quantity')?.value) || 1;
  const line1       = document.getElementById('r-addr-line1')?.value?.trim();
  const city        = document.getElementById('r-addr-city')?.value?.trim();
  const state       = document.getElementById('r-addr-state')?.value?.trim();
  const pincode     = document.getElementById('r-addr-pincode')?.value?.trim();

  // Validate
  if (!productName) {
    showFormError('r-product-name', 'Please enter a product name or description.');
    return;
  }
  if (!line1 || !city || !state || !pincode) {
    showToast('Please complete your full delivery address.', 'error');
    return;
  }
  if (!/^\d{6}$/.test(pincode)) {
    showFormError('r-addr-pincode', 'Please enter a valid 6-digit pincode.');
    return;
  }

  const requestData = {
    userId:      session.id,
    userName:    session.name,
    userEmail:   session.email,
    userPhone:   session.phone || '—',
    productName,
    description,
    size,
    quantity,
    address: { line1, city, state, pincode },
  };

  const btn = document.getElementById('submit-request-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting & Opening WhatsApp...'; }

  const savedRequest = Storage.addRequest(requestData);

  // Send WhatsApp Direct Notification to Admin (+91 8128033449)
  WhatsAppService.sendNotification(requestData);

  showToast('Request saved & opening WhatsApp to notify admin! 💬', 'success');
  document.getElementById('request-form')?.reset();

  if (btn) { btn.disabled = false; btn.textContent = '💬 Submit & Send via WhatsApp'; }

  // Show success state
  renderUserRequests();
  switchUserTab('history');
}

function showFormError(inputId, msg) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.style.borderColor = 'var(--error)';
  input.focus();
  showToast(msg, 'error');
  setTimeout(() => { input.style.borderColor = ''; }, 3000);
}

// ── Request History ───────────────────────────────────────────────────────

function renderUserRequests() {
  const container = document.getElementById('user-requests-list');
  if (!container) return;

  const session = Auth.getSession();
  const requests = Storage.getRequestsByUserId(session.id);

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="up-empty">
        <span class="up-empty-icon">📭</span>
        <div class="up-empty-title">No requests yet</div>
        <div class="up-empty-desc">Submit your first product request and our team will get back to you via WhatsApp.</div>
        <button class="btn btn-primary" onclick="switchUserTab('request')">Make a Request</button>
      </div>
    `;
    return;
  }

  container.innerHTML = requests.map((r) => `
    <div class="request-history-card">
      <div class="request-history-header">
        <div>
          <div class="request-product-name">${r.productName}</div>
          <div class="request-meta">
            ${r.size ? `Size: <strong>${r.size}</strong>` : ''}
            ${r.size && r.quantity ? ' &nbsp;·&nbsp; ' : ''}
            ${r.quantity ? `Qty: <strong>${r.quantity}</strong>` : ''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <span class="badge badge-status-${r.status}">
            ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}
          </span>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.4rem">${formatDate(r.createdAt)}</div>
        </div>
      </div>

      ${r.description ? `
        <div style="font-size:0.82rem;color:var(--text-muted);line-height:1.6;margin-bottom:0.5rem">${r.description}</div>
      ` : ''}

      <div class="request-address-chip">
        <span>📍</span>
        <span>${r.address
          ? `${r.address.line1}, ${r.address.city}, ${r.address.state} — ${r.address.pincode}`
          : 'No address provided'}</span>
      </div>

      ${r.adminNotes ? `
        <div class="request-admin-note">
          <strong>💬 Admin Note:</strong> ${r.adminNotes}
        </div>
      ` : ''}
    </div>
  `).join('');
}
