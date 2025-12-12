# 🚀 Deploy Frontend on Render

Your backend is already live at: **https://kyokushin-api.onrender.com** ✅

Now let's deploy the frontend on Render too!

## Steps:

### 1. Create New Web Service
- Go to https://render.com/dashboard
- Click **"New +"** → **"Web Service"**
- Select `kyokushin_karate_india` repository

### 2. Configure Service
```
Name: kyokushin-frontend
Region: Oregon (same as backend)
Branch: main
Root Directory: frontend
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 3. Add Environment Variable
Click **"Add Environment Variable"**:
```
Key: NEXT_PUBLIC_API_URL
Value: https://kyokushin-api.onrender.com/api
```

### 4. Deploy
- Click **"Create Web Service"**
- Wait 3-5 minutes
- Your frontend will be live at: `https://kyokushin-frontend.onrender.com`

### 5. Update Backend CORS
- Go to your backend service: `kyokushin-api`
- Click **"Environment"** tab
- Update `FRONTEND_URL`:
  ```
  FRONTEND_URL=https://kyokushin-frontend.onrender.com
  ```
- Click **"Save Changes"**

## ✅ Done!

Your full-stack app will be live at:
- **Frontend:** https://kyokushin-frontend.onrender.com
- **Backend:** https://kyokushin-api.onrender.com

Login with:
- Email: `admin@kyokushin.in`
- Password: `Karate@123`

---

## Alternative: Netlify (If you prefer)

### 1. Sign up at https://netlify.com with GitHub

### 2. Create New Site
- Click **"Add new site"** → **"Import an existing project"**
- Select your repo
- Configure:
  ```
  Base directory: frontend
  Build command: npm run build
  Publish directory: .next
  ```

### 3. Add Environment Variable
```
NEXT_PUBLIC_API_URL=https://kyokushin-api.onrender.com/api
```

### 4. Deploy!

---

## Note on Free Tier
- Both Render free services may "sleep" after 15 min of inactivity
- First request takes 30-60 seconds to wake up
- After that, it's fast!
- Consider upgrading backend to paid ($7/month) for always-on
