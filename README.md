# Shopify Landing Page Backend

A robust Node.js/Express backend for handling contact form submissions with MongoDB Atlas integration, reCAPTCHA verification, and comprehensive validation.

## Features

- **Form Validation**: Server-side validation for all form fields
- **reCAPTCHA Integration**: Google reCAPTCHA v3 for spam protection
- **Rate Limiting**: Prevents spam submissions
- **Duplicate Prevention**: Prevents duplicate submissions within 1 hour
- **MongoDB Atlas**: Cloud database storage
- **Email Notifications**: Optional email notifications for new submissions
- **Admin Dashboard**: API endpoints for managing contacts
- **Security**: Helmet.js, CORS, input sanitization

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

\`\`\`env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopify-landing
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
\`\`\`

### 2. MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Add your connection string to the `.env` file

### 3. Google reCAPTCHA Setup

1. Go to [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Create a new site (v3)
3. Add your domain
4. Get your site key and secret key
5. Add them to your `.env` file

### 4. Installation

\`\`\`bash
npm install
\`\`\`

### 5. Database Setup

\`\`\`bash
node scripts/setup-database.js
\`\`\`

### 6. Start the Server

\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

## API Endpoints

### POST /api/contact
Submit a contact form

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "message": "I'm interested in your services",
  "formType": "hero",
  "recaptchaToken": "recaptcha_token_here"
}
\`\`\`

### GET /api/contacts
Get all contact submissions (admin only)

### PATCH /api/contacts/:id/status
Update contact status (admin only)

### GET /api/health
Health check endpoint

## Frontend Integration

Replace your existing form action with the new API endpoint:

\`\`\`tsx
// Remove this line:
// <form action="https://usebasin.com/f/20a5cdbdbe69" method="POST">

// Replace with:
<ContactForm formType="hero" />
\`\`\`

## Security Features

- Input validation and sanitization
- Rate limiting (5 requests per 15 minutes)
- reCAPTCHA verification
- Duplicate submission prevention
- CORS protection
- Helmet.js security headers

## Deployment

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard

### Railway Deployment

1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB Atlas connection string | Yes |
| RECAPTCHA_SECRET_KEY | Google reCAPTCHA secret key | Yes |
| RECAPTCHA_SITE_KEY | Google reCAPTCHA site key | Yes |
| PORT | Server port (default: 5000) | No |
| NODE_ENV | Environment (development/production) | No |
| FRONTEND_URL | Frontend URL for CORS | Yes |
| SMTP_HOST | Email server host | No |
| SMTP_PORT | Email server port | No |
| SMTP_USER | Email username | No |
| SMTP_PASS | Email password | No |

## Support

For support, email hello@delhidigital.co or call +91-92051-10208.
