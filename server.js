const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { body, validationResult } = require("express-validator")
const axios = require("axios")

// Load environment variables FIRST
require("dotenv").config()

// NOW load email service after env vars are loaded
const emailService = require("./utils/emailService")

// Add debugging logs to check email configuration 
console.log("=== EMAIL CONFIGURATION DEBUG ===")
console.log("SMTP_HOST:", process.env.SMTP_HOST)
console.log("SMTP_PORT:", process.env.SMTP_PORT)
console.log("SMTP_USER:", process.env.SMTP_USER)
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "SET (length: " + process.env.SMTP_PASS.length + ")" : "NOT SET")
console.log("=====================================")

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())

// CORS Configuration - Fixed
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "https://shopify-landing-page-three.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 20 : 5, // More requests in development
  message: {
    success: false,
    error: "Too many form submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log(" Connected to MongoDB Atlas"))
  .catch((err) => console.error(" MongoDB connection error:", err))

// Contact Form Schema
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 255,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: /^[0-9]{10}$/,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  formType: {
    type: String,
    enum: ["hero", "final"],
    required: true,
  },
  // ipAddress: String,
  // userAgent: String,
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["new", "contacted", "converted"],
    default: "new",
  },
})

const Contact = mongoose.model("Contact", contactSchema)

// Validation middleware
const validateContactForm = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .isLength({ max: 255 })
    .withMessage("Email is too long"),

  body("phone")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be exactly 10 digits"),

  body("message").trim().isLength({ min: 10, max: 1000 }).withMessage("Message must be between 10 and 1000 characters"),

  body("formType").isIn(["hero", "final"]).withMessage("Invalid form type"),

  body("recaptchaToken").notEmpty().withMessage("Please complete the captcha verification"),
]

// reCAPTCHA verification function
async function verifyRecaptcha(token) {
  try {
    // Skip reCAPTCHA verification in development
    if (process.env.NODE_ENV === "development") {
      console.log(" Development mode: Skipping reCAPTCHA verification")
      return true
    }

    // Allow fallback tokens in development
    if (token === "development_token" || token === "fallback_token" || token === "test_token") {
      console.log("Using development/fallback token, allowing submission")
      return true
    }

    // Verify with Google reCAPTCHA
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      console.log("No reCAPTCHA secret key found, allowing submission")
      return true
    }

    const response = await axios.post("https://www.google.com/recaptcha/api/siteverify", null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      },
      timeout: 5000, // 5 second timeout
    })

    console.log(" reCAPTCHA verification response:", response.data)
    return response.data.success
  } catch (error) {
    console.error("reCAPTCHA verification error:", error.message)
    // In development, allow submission even if reCAPTCHA fails
    return process.env.NODE_ENV === "development"
  }
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Delhi Digital Co - Shopify Landing Page API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      contact: "/api/contact",
      contacts: "/api/contacts",
    },
    timestamp: new Date().toISOString(),
  })
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running perfectly",
    status: "healthy",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      email: process.env.SMTP_USER ? "configured" : "not configured",
      recaptcha: process.env.RECAPTCHA_SECRET_KEY ? "configured" : "not configured",
    },
  })
})

// Contact form submission endpoint - MAIN ENDPOINT
app.post("/api/contact", limiter, validateContactForm, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { name, email, phone, message, formType, recaptchaToken } = req.body

    console.log("=== CONTACT FORM SUBMISSION ===")
    console.log(" Name:", name)
    console.log(" Email:", email)
    console.log(" Phone:", phone)
    console.log(" Form Type:", formType)
    console.log(" reCAPTCHA token:", recaptchaToken ? recaptchaToken.substring(0, 20) + "..." : "None")
    console.log(" IP Address:", req.ip || req.connection.remoteAddress)

    // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken)
    if (!isRecaptchaValid) {
      return res.status(400).json({
        success: false,
        message: "Captcha verification failed. Please try again.",
      })
    }

    // Check for duplicate submissions (same email and phone within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const existingSubmission = await Contact.findOne({
      $or: [{ email: email }, { phone: phone }],
      submittedAt: { $gte: oneHourAgo },
    })

    if (existingSubmission) {
      return res.status(429).json({
        success: false,
        message:
          "A submission with this email or phone number was already received recently. Please wait before submitting again.",
      })
    }

    // Create new contact entry
    const newContact = new Contact({
      name,
      email,
      phone,
      message,
      formType,
      // ipAddress: req.ip || req.connection.remoteAddress,
      // userAgent: req.get("User-Agent"),
    })

    await newContact.save()

    // Prepare contact data for emails
    const contactData = {
      name,
      email,
      phone,
      message,
      formType,
      submittedAt: newContact.submittedAt,
      // ipAddress: newContact.ipAddress,
    }

    // Send emails (don't wait for them to complete)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log("Attempting to send emails...")

      // Send notification email to admin
      emailService.sendContactNotification(contactData).catch((error) => {
        console.error("Failed to send admin notification:", error.message)
      })

      // Send auto-reply to user
      emailService.sendAutoReply(contactData).catch((error) => {
        console.error("Failed to send auto-reply:", error.message)
      })
    } else {
      console.log("Email configuration not found, skipping email notifications")
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: "Thank you for your inquiry! We will contact you within 24 hours.",
      data: {
        id: newContact._id,
        submittedAt: newContact.submittedAt,
        formType: newContact.formType,
      },
    })

    // Log successful submission
    console.log(`New contact form submission saved: ${name} (${email}) - ${formType} form`)
  } catch (error) {
    console.error("Contact form submission error:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Get all contacts (admin endpoint)
app.get("/api/contacts", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const contacts = await Contact.find().sort({ submittedAt: -1 }).skip(skip).limit(limit).select("-__v")

    const total = await Contact.countDocuments()

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching contacts:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching contacts",
    })
  }
})

// Update contact status (admin endpoint)
app.patch("/api/contacts/:id/status", async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!["new", "contacted", "converted"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      })
    }

    const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true })

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      })
    }

    res.json({
      success: true,
      data: contact,
    })
  } catch (error) {
    console.error("Error updating contact status:", error)
    res.status(500).json({
      success: false,
      message: "Error updating contact status",
    })
  }
})

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: ["GET /api/health", "POST /api/contact", "GET /api/contacts", "PATCH /api/contacts/:id/status"],
  })
})

// General 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    requestedUrl: req.originalUrl,
    method: req.method,
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error)
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Server URL: http://localhost:${PORT}`)
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`)
  console.log(`Email notifications: ${process.env.SMTP_USER ? "Enabled" : "Disabled"}`)
  console.log(`reCAPTCHA: ${process.env.RECAPTCHA_SECRET_KEY ? "Enabled" : "Disabled"}`)
  console.log(`Database: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`)
  console.log("=".repeat(50))
})

module.exports = app
