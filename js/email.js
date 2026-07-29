/**
 * ZENTRA — Email Notification Service
 * Integrates EmailJS to dispatch email notifications directly to admin email when a user requests a t-shirt.
 */

const EmailService = {
  /**
   * Initialize EmailJS SDK if keys are set
   */
  init() {
    if (
      window.emailjs &&
      window.ZENTRA_CONFIG?.emailjs?.enabled &&
      window.ZENTRA_CONFIG?.emailjs?.publicKey &&
      window.ZENTRA_CONFIG.emailjs.publicKey !== 'YOUR_PUBLIC_KEY'
    ) {
      try {
        emailjs.init(window.ZENTRA_CONFIG.emailjs.publicKey);
        console.log('EmailJS SDK Initialized Successfully.');
      } catch (err) {
        console.error('EmailJS Init Error:', err);
      }
    }
  },

  /**
   * Send new product request notification email to Admin
   */
  async sendRequestToAdmin(requestData) {
    const config = window.ZENTRA_CONFIG;
    const adminEmail = config?.adminEmail || 'admin@zentra.in';

    const fullAddress = requestData.address
      ? `${requestData.address.line1}, ${requestData.address.city}, ${requestData.address.state} - ${requestData.address.pincode}`
      : 'No address provided';

    // If EmailJS is enabled and configured
    if (
      window.emailjs &&
      config?.emailjs?.enabled &&
      config.emailjs.publicKey !== 'YOUR_PUBLIC_KEY'
    ) {
      try {
        const templateParams = {
          to_email: adminEmail,
          user_name: requestData.userName,
          user_email: requestData.userEmail,
          user_phone: requestData.userPhone,
          product_name: requestData.productName,
          size: requestData.size || 'N/A',
          quantity: requestData.quantity || 1,
          description: requestData.description || 'None provided',
          address: fullAddress,
          date: new Date().toLocaleString('en-IN'),
        };

        const res = await emailjs.send(
          config.emailjs.serviceId,
          config.emailjs.templateId,
          templateParams
        );
        console.log('Admin Email Notification Sent:', res.status, res.text);
        return { success: true, method: 'emailjs' };
      } catch (err) {
        console.error('Failed to send email via EmailJS:', err);
        return { success: false, error: err };
      }
    }

    // Fallback/Simulated email notification
    console.log(`[EMAIL NOTIFICATION TO ADMIN (${adminEmail})]`, {
      subject: `🔥 New T-Shirt Request: ${requestData.productName}`,
      user: `${requestData.userName} (${requestData.userPhone}, ${requestData.userEmail})`,
      product: requestData.productName,
      size: requestData.size,
      quantity: requestData.quantity,
      address: fullAddress,
      notes: requestData.description,
    });

    return { success: true, method: 'simulated' };
  },
};

document.addEventListener('DOMContentLoaded', () => {
  EmailService.init();
});
