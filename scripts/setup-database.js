const mongoose = require("mongoose")
require("dotenv").config()

async function setupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000, // timeout faster if DNS fails
      socketTimeoutMS: 45000, // increase socket timeout for slow connections
    })

    console.log("Connected to MongoDB Atlas")

    // Create indexes for better performance
    const Contact = mongoose.model(
      "Contact",
      new mongoose.Schema({
        name: String,
        email: String,
        phone: String,
        message: String,
        formType: String,
        // ipAddress: String,
        // userAgent: String,
        submittedAt: Date,
        status: String,
      }),
    )

    // Create indexes
    await Contact.createIndexes([{ email: 1 }, { phone: 1 }, { submittedAt: -1 }, { status: 1 }])

    console.log("Database indexes created successfully")

    // Create a test document
    const testContact = new Contact({
      name: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      message: "This is a test message",
      formType: "hero",
      // ipAddress: "127.0.0.1",
      // userAgent: "Test Agent",
      status: "new",
    })

    await testContact.save()
    console.log("Test contact created successfully")

    // Clean up test data
    await Contact.deleteOne({ email: "test@example.com" })
    console.log("Test contact cleaned up")

    console.log("Database setup completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("Database setup error:", error)
    process.exit(1)
  }
}

setupDatabase()
