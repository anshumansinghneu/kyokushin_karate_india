# Example environment variables for PRODUCTION deployment

# ============================================
# BACKEND ENVIRONMENT VARIABLES (Render)
# ============================================
# Add these in Render Dashboard → Your Service → Environment

PORT=8000
NODE_ENV=production

# Database URL from Render PostgreSQL (use INTERNAL URL)
DATABASE_URL=postgresql://username:password@hostname/database_name

# Generate a secure random string (at least 32 characters)
# You can generate one at: https://randomkeygen.com/
JWT_SECRET=change-this-to-a-long-random-secret-string-min-32-chars

# Your Vercel frontend URL (update after deploying frontend)
FRONTEND_URL=https://kyokushin-karate-india.vercel.app


# ============================================
# FRONTEND ENVIRONMENT VARIABLES (Vercel)
# ============================================
# Add these in Vercel Dashboard → Your Project → Settings → Environment Variables

# Your Render backend URL (update after deploying backend)
NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com/api


# ============================================
# IMPORTANT NOTES
# ============================================
# 1. NEVER commit .env files to git
# 2. Update FRONTEND_URL in backend after getting Vercel URL
# 3. Update NEXT_PUBLIC_API_URL in frontend after getting Render URL
# 4. Use INTERNAL DATABASE_URL from Render for better performance
# 5. JWT_SECRET must be a long random string in production
