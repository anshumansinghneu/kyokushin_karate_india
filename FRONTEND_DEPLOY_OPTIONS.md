# 🎯 QUICK FRONTEND DEPLOYMENT

## Your Backend is Already Live! ✅

**URL:** https://kyokushin-api.onrender.com

---

## Deploy Frontend (Choose One):

### ⭐ OPTION 1: Render (Recommended - Everything in one place)

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Select `kyokushin_karate_india`
4. Configure:
   - **Name:** `kyokushin-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment Variable:**
     ```
     NEXT_PUBLIC_API_URL=https://kyokushin-api.onrender.com/api
     ```
5. Click **"Create Web Service"**
6. Wait 3-5 minutes

**Then Update Backend:**

- Go to `kyokushin-api` service
- Environment → `FRONTEND_URL` → Set to your new frontend URL
- Save

---

### 🌐 OPTION 2: Netlify

1. Go to https://netlify.com
2. Sign up with GitHub
3. **"Add new site"** → **"Import project"**
4. Select `kyokushin_karate_india`
5. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Environment Variable:**
     ```
     NEXT_PUBLIC_API_URL=https://kyokushin-api.onrender.com/api
     ```
6. Deploy!

**Then Update Backend:**

- Go to Render → `kyokushin-api` service
- Environment → `FRONTEND_URL` → Set to your Netlify URL
- Save

---

### ☁️ OPTION 3: Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Select `kyokushin_karate_india`
5. Click on the service → **"Settings"**
   - **Root Directory:** `/frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
6. Go to **"Variables"** tab:
   ```
   NEXT_PUBLIC_API_URL=https://kyokushin-api.onrender.com/api
   ```
7. Deploy!

**Then Update Backend:**

- Go to Render → `kyokushin-api` service
- Environment → `FRONTEND_URL` → Set to your Railway URL
- Save

---

## Troubleshooting Vercel

If you want to fix Vercel instead, tell me the error message and I'll help!

Common fixes:

- Make sure **Root Directory** is set to `frontend`
- Check build logs for errors
- Verify environment variable is set correctly
