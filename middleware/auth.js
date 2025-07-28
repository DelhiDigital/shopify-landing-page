const jwt = require("jsonwebtoken")

// Simple admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "")

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = decoded
    next()
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid token.",
    })
  }
}

module.exports = { authenticateAdmin }
