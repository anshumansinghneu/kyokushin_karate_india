# 🚀 QUICK START - Deploy in 10 Minutes

## Step 1: Deploy Backend (5 min)

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 2. Create Database
- Click **"New +"** → **"PostgreSQL"**
- Name: `kyokushin-db`
- Region: Choose closest to you
- Click **"Create Database"**
- **Copy the "Internal Database URL"** - you'll need it!

### 3. Deploy Backend
- Click **"New +"** → **"Web Service"**
- Select `kyokushin_karate_india` repository
- Settings:
  - Name: `kyokushin-backend`
  - Root Directory: `backend`
  - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
  - Start Command: `npm start`
  
- **Environment Variables:**
  ```
  PORT=8000
  NODE_ENV=production
  JWT_SECRET=your-random-secret-at-least-32-characters-long
  DATABASE_URL=<paste-internal-database-url-here>
  FRONTEND_URL=https://kyokushin-karate-india.vercel.app
  ```

- Click **"Create Web Service"**
- Wait for deployment (3-5 min)
- **Copy your backend URL:** `https://kyokushin-backend-xxxx.onrender.com`

### 4. Seed Database
- In Render, go to your backend service
- Click **"Shell"** tab
- Run: `npm run seed`

---

## Step 2: Deploy Frontend (5 min)

### 1. Create Vercel Account
- Go to https://vercel.com
- Sign up with GitHub

### 2. Import Project
- Click **"Add New..."** → **"Project"**
- Select `kyokushin_karate_india`
- Click **"Import"**

### 3. Configure
- Root Directory: `frontend`
- Framework: Next.js (auto-detected)
- **Environment Variable:**
  ```
  NEXT_PUBLIC_API_URL=https://kyokushin-backend-xxxx.onrender.com/api
  ```
  (Use YOUR backend URL from Step 1!)

- Click **"Deploy"**
- Wait 2-3 minutes
- **Copy your frontend URL**

### 4. Update Backend CORS
- Go back to Render
- Open backend service → **"Environment"**
- Update `FRONTEND_URL` with your Vercel URL
- Save (service will restart)

---

## Step 3: Test (1 min)

### Test Backend:
`https://your-backend.onrender.com/health`

Should show: `{"status":"ok"}`

### Test Frontend:
Open your Vercel URL and login:
- Email: `admin@kyokushin.in`
- Password: `Karate@123`

---

## ✅ DONE!

Your app is live! 🎉

**Important URLs:**
- Frontend: https://your-app.vercel.app
- Backend: https://your-backend.onrender.com
- Credentials: See DEMO_CREDENTIALS.md

**Note:** First request to Render backend takes 30-60 seconds (free tier cold start)
