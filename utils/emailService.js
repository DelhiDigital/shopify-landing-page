const nodemailer = require("nodemailer")

// Email service for notifications
class EmailService {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  initializeTransporter() {
    // Check if email config exists
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // FIX: Use createTransport (not createTransporter)
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number.parseInt(process.env.SMTP_PORT),
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })
        console.log(" Email service initialized successfully")
      } catch (error) {
        console.error(" Error initializing email service:", error.message)
        this.transporter = null
      }
    } else {
      console.log(" Email configuration not complete:")
      console.log("  SMTP_USER:", process.env.SMTP_USER ? "SET" : "NOT SET")
      console.log("  SMTP_PASS:", process.env.SMTP_PASS ? "SET" : "NOT SET")
      this.transporter = null
    }
  }

  // Re-initialize if needed
  ensureTransporter() {
    if (!this.transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.initializeTransporter()
    }
    return this.transporter !== null
  }

  async sendContactNotification(contactData) {
    if (!this.ensureTransporter()) {
      console.log(" Email service not configured, skipping admin notification")
      return
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL || "pradum@delhidigital.co",
        subject: ` New Contact Form Submission - ${contactData.formType.toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              New Contact Form Submission
            </h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Form Type:</strong> <span style="color: #007bff;">${contactData.formType.toUpperCase()}</span></p>
              <p><strong>Name:</strong> ${contactData.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
              <p><strong>Phone:</strong> <a href="tel:+91${contactData.phone}">+91-${contactData.phone}</a></p>
              <p><strong>Submitted At:</strong> ${new Date(contactData.submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
            
            </div>
            
            <div style="background-color: #fff; border: 1px solid #dee2e6; padding: 20px; border-radius: 5px;">
              <h3 style="color: #333; margin-top: 0;">Message:</h3>
              <p style="line-height: 1.6; color: #555;">${contactData.message}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-radius: 5px;">
              <p style="margin: 0; color: #0066cc;">
                <strong>Quick Actions:</strong><br>
                 Call: <a href="tel:+91${contactData.phone}">+91-${contactData.phone}</a><br>
                 Reply: <a href="mailto:${contactData.email}">Send Email</a><br>
                 WhatsApp: <a href="https://wa.me/91${contactData.phone}">Send Message</a>
              </p>
            </div>
          </div>
        `,
      }

      await this.transporter.sendMail(mailOptions)
      console.log(" Contact notification email sent successfully")
    } catch (error) {
      console.error(" Error sending contact notification email:", error.message)
      throw error
    }
  }

  async sendAutoReply(contactData) {
    if (!this.ensureTransporter()) {
      console.log(" Email service not configured, skipping auto-reply")
      return
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: contactData.email,
        subject: "Thank you for contacting Delhi Digital Co.",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Thank You!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We've received your inquiry</p>
            </div>
            
            <div style="background-color: #fff; padding: 30px; border: 1px solid #dee2e6; border-top: none;">
              <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear <strong>${contactData.name}</strong>,</p>
              
              <p style="line-height: 1.6; color: #555; margin-bottom: 20px;">
                Thank you for reaching out to Delhi Digital Co! We have successfully received your message and our team will review it carefully.
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #007bff; margin-top: 0;">What happens next?</h3>
                <ul style="color: #555; line-height: 1.8;">
                  <li>Our expert team will review your requirements</li>
                  <li>We'll prepare a customized solution for your project</li>
                  <li>You'll receive a detailed response within <strong>24 hours</strong></li>
                  <li>We'll schedule a free consultation call to discuss your needs</li>
                </ul>
              </div>
              
              <div style="background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #0066cc; margin-top: 0;">Need immediate assistance?</h3>
                <p style="margin: 10px 0; color: #555;">
                   <strong>Call us:</strong> <a href="tel:+919205110208" style="color: #007bff; text-decoration: none;">+91-92051-10208</a><br>
                   <strong>WhatsApp:</strong> <a href="https://wa.me/919205110208" style="color: #007bff; text-decoration: none;">Chat with us instantly</a><br>
                   <strong>Email:</strong> <a href="mailto:hello@delhidigital.co" style="color: #007bff; text-decoration: none;">pradum@delhidigital.co</a>
                </p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #666; margin-bottom: 10px;">Best regards,</p>
                <p style="color: #007bff; font-weight: bold; margin: 0;">Delhi Digital Co Team</p>
                <p style="color: #888; font-size: 14px; margin: 5px 0 0 0;">Your Trusted Shopify Development Partner</p>
              </div>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #dee2e6; border-top: none;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                This is an automated response. Please do not reply to this email.<br>
                For support, contact us at <a href="mailto:hello@delhidigital.co" style="color: #007bff;">pradum@delhidigital.co</a>
              </p>
            </div>
          </div>
        `,
      }

      await this.transporter.sendMail(mailOptions)
      console.log(" Auto-reply email sent successfully")
    } catch (error) {
      console.error(" Error sending auto-reply email:", error.message)
      throw error
    }
  }
}

module.exports = new EmailService()
