# 🚂 Railway Deployment Guide

## Step 1: Prepare Your Code

Your code is ready! The files you need are:
- ✅ `telegram-webhook.js` - Your webhook server
- ✅ `package.json` - Node.js configuration
- ✅ `add_chat_id_column.sql` - Database migration (run this in Supabase)

## Step 2: Create Railway Account

1. Go to https://railway.app
2. Click "Sign Up" or "Log In"
3. Sign up with GitHub (easiest method)

## Step 3: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account
4. Select your repository (if you've pushed the code)
   
   OR
   
   **"Empty Project"** → **"Empty Buildpacks"**

## Step 4: Deploy the Webhook Server

### Option A: If code is on GitHub

1. Railway will detect `package.json` automatically
2. Set the **Start Command** to: `node telegram-webhook.js`
3. Railway will auto-deploy!

### Option B: Deploy manually

1. Click **"New"** → **"Empty Service"**
2. Click **"Connect to Repo"** → Select your GitHub repo
3. Railway will detect Node.js
4. Click **"Settings"** → **"Deploy"**
5. Set **Start Command**: `node telegram-webhook.js`

## Step 5: Get Your Public URL

Once deployed:
1. Click on your service
2. Go to **"Settings"** tab
3. Find your **"Public URL"** (something like `https://your-app.up.railway.app`)

## Step 6: Set Telegram Webhook

Run this command (replace YOUR_URL with your Railway URL):

```bash
curl -X POST "https://api.telegram.org/bot8318381464:AAH2YMr_oZP8f27UZ1q2l7I0_eOaIaIFVWI/setWebhook" \
  -d "url=YOUR_RAILWAY_URL"
```

For example:
```bash
curl -X POST "https://api.telegram.org/bot8318381464:AAH2YMr_oZP8f27UZ1q2l7I0_eOaIaIFVWI/setWebhook" \
  -d "url=https://your-app.up.railway.app"
```

## Step 7: Run the SQL Migration

Go to **Supabase SQL Editor** and run:

```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_telegram_chat_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS accepted_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pending';

UPDATE orders 
SET status = 'Pending' 
WHERE status IS NULL;
```

## Step 8: Test It!

1. Go to admin dashboard: `#/admin`
2. Click "Send to Riders" on an order
3. Check Telegram riders group
4. Click "Accept" button
5. Customer should get notified! ✅

## Troubleshooting

### Check Logs
- In Railway, go to **"Deployments"** tab
- Click on a deployment → **"View Logs"**
- Look for any errors

### Verify Webhook
```bash
curl https://api.telegram.org/bot8318381464:AAH2YMr_oZP8f27UZ1q2l7I0_eOaIaIFVWI/getWebhookInfo
```

### Manual Deployment
If automatic deployment fails:
1. Install Railway CLI: `npm i -g @railway/cli`
2. Run: `railway login`
3. Run: `railway up`

## ✅ Done!

Your webhook server is now live and handling button clicks automatically!

