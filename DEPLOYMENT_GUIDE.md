# 🚀 Complete Vercel Deployment Guide

## 📋 Prerequisites

- GitHub account (already have ✓)
- Vercel account (sign up at vercel.com)
- Render account for backend (sign up at render.com)
- Neon/Supabase account for PostgreSQL (or use Render's free PostgreSQL)

---

## 🎯 STEP 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 1.2 Create PostgreSQL Database
1. From Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `kyokushin-db`
   - **Database:** `kyokushin_db`
   - **User:** (auto-generated)
   - **Region:** Choose closest to you
   - **Plan:** Free
3. Click **"Create Database"**
4. Wait 2-3 minutes for provisioning
5. **SAVE THESE VALUES:**
   - Internal Database URL
   - External Database URL
   - PSQL Command

### 1.3 Deploy Backend Service
1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `kyokushin_karate_india`
3. Configure:
   - **Name:** `kyokushin-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   PORT=8000
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
   DATABASE_URL=<paste-internal-database-url-from-step-1.2>
   FRONTEND_URL=https://kyokushin-karate-india.vercel.app
   ```

5. Click **"Create Web Service"**
6. Wait 5-10 minutes for deployment
7. **SAVE YOUR BACKEND URL:** `https://kyokushin-backend.onrender.com`

### 1.4 Seed the Production Database
1. Go to your backend service on Render
2. Click **"Shell"** tab
3. Run: `npm run seed`
4. Verify success (you should see the credentials output)

---

## 🎯 STEP 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

### 2.2 Import Project
1. From Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Find `kyokushin_karate_india` repository
3. Click **"Import"**

### 2.3 Configure Project
1. **Framework Preset:** Next.js (auto-detected)
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Install Command:** `npm install` (default)

### 2.4 Add Environment Variables
Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_API_URL=https://kyokushin-backend.onrender.com/api
```

**Important:** Replace `kyokushin-backend` with your actual Render service name!

### 2.5 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll get a URL like: `https://kyokushin-karate-india.vercel.app`

### 2.6 Update Backend CORS
1. Go back to Render
2. Open your backend service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://kyokushin-karate-india.vercel.app
   ```
5. Click **"Save Changes"** (service will restart)

---

## 🎯 STEP 3: Configure Custom Domain (Optional)

### If you want a custom domain like kyokushin.in:

1. In Vercel, go to your project → **"Settings"** → **"Domains"**
2. Add your domain
3. Update your domain's DNS settings with provided nameservers
4. Wait for DNS propagation (5-30 minutes)

---

## 🎯 STEP 4: Test Deployment

### 4.1 Test Backend
Open: `https://kyokushin-backend.onrender.com/api/health` (or your URL)

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 4.2 Test Frontend
1. Open your Vercel URL
2. Try to register a new user
3. Login with demo credentials:
   - Email: `admin@kyokushin.in`
   - Password: `Karate@123`

---

## 📝 Environment Variables Reference

### Backend (.env on Render)
```bash
PORT=8000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=generate-a-long-random-string-here
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Frontend (.env on Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot connect to database"
**Solution:** Check DATABASE_URL is the **Internal Database URL** from Render

### Issue 2: "CORS Error"
**Solution:** Verify FRONTEND_URL in backend matches your Vercel URL exactly

### Issue 3: "502 Bad Gateway on backend"
**Solution:** 
- Check Render logs
- Verify Prisma migrations ran successfully
- Restart the service

### Issue 4: "Prisma migrations failed"
**Solution:** Run manually in Render Shell:
```bash
npx prisma migrate deploy
```

### Issue 5: "Free tier backend sleeps after 15 min"
**Solution:** 
- Upgrade to paid plan, OR
- Use a service like UptimeRobot to ping your backend every 14 minutes
- First request after sleep will take 30-60 seconds

---

## 🔄 How to Update After Changes

### Update Frontend:
```bash
git add .
git commit -m "update message"
git push
```
Vercel auto-deploys on push!

### Update Backend:
```bash
git add .
git commit -m "update message"
git push
```
Render auto-deploys on push!

### Update Database Schema:
1. Make changes to `schema.prisma`
2. Create migration locally: `npx prisma migrate dev --name your_change`
3. Push to GitHub
4. Render will auto-run migrations on deploy

---

## 🎉 You're Done!

Your app is now live at:
- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-backend.onrender.com

Share these URLs for your demo! 🥋

---

## 💡 Pro Tips

1. **Monitor Logs:**
   - Vercel: Project → "Deployments" → Click deployment → "View Function Logs"
   - Render: Service → "Logs" tab

2. **Database Backups:**
   - Render free tier doesn't include backups
   - Consider upgrading or use Neon/Supabase with backups

3. **Performance:**
   - First load on Render free tier takes 30-60 seconds (cold start)
   - Consider upgrading to paid plan ($7/month) for always-on

4. **Environment Variables:**
   - Never commit `.env` files
   - Use Vercel/Render dashboards for secrets

5. **SSL:**
   - Both Vercel and Render provide free SSL certificates
   - Your sites automatically use HTTPS
