/**
 * ZENTRA — WhatsApp Direct Notification System
 * Formats a clean order request message and opens WhatsApp
 * directly to Admin's phone number (+91 8128033449)
 */

const WhatsAppService = {
  /**
   * Format order request details into a WhatsApp message
   */
  formatMessage(requestData) {
    const fullAddress = requestData.address
      ? `${requestData.address.line1}, ${requestData.address.city}, ${requestData.address.state} - ${requestData.address.pincode}`
      : 'N/A';

    return `*🔥 NEW PRODUCT REQUEST — ZENTRA*
────────────────────────────
*👤 Customer Details:*
• *Name:* ${requestData.userName}
• *Mobile:* ${requestData.userPhone}
• *Email:* ${requestData.userEmail || 'N/A'}

*👕 Product Details:*
• *Item wanted:* ${requestData.productName}
• *Size:* ${requestData.size || 'N/A'}
• *Quantity:* ${requestData.quantity || 1}
${requestData.description ? `• *Notes:* ${requestData.description}` : ''}

*📍 Delivery Address:*
${fullAddress}

*📅 Date:* ${new Date().toLocaleString('en-IN')}
────────────────────────────
_Sent via ZENTRA Web Request Portal_`;
  },

  /**
   * Generate WhatsApp link — always uses admin personal number from config
   */
  getWhatsAppUrl(requestData) {
    const phone = (window.ZENTRA_CONFIG && window.ZENTRA_CONFIG.adminWhatsApp)
      ? window.ZENTRA_CONFIG.adminWhatsApp
      : '918128033449'; // fallback hardcoded
    const message = this.formatMessage(requestData);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Send WhatsApp notification (opens WhatsApp app/web in a new tab)
   */
  sendNotification(requestData) {
    const url = this.getWhatsAppUrl(requestData);
    window.open(url, '_blank');
  },
};
