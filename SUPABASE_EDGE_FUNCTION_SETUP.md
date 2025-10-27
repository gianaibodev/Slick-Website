# 🚀 Supabase Edge Function Setup Guide

## Step 1: Deploy the Function

### Using Supabase Dashboard:

1. Go to your Supabase project: https://supabase.com/dashboard/project/ojuhzknpzxneilvxhlcm
2. Click **"Edge Functions"** in the left sidebar
3. Click **"Create a new function"**
4. Name it: `telegram-callback`
5. Paste the code from: `supabase/functions/telegram-callback/index.ts`
6. Click **"Deploy function"**

### Using CLI (Alternative):

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref ojuhzknpzxneilvxhlcm

# Deploy the function
supabase functions deploy telegram-callback
```

## Step 2: Set Environment Variables (CRITICAL!)

After deployment, you need to set secrets:

### In Supabase Dashboard:

1. Go to **Edge Functions** → **Manage**
2. Find `telegram-callback`
3. Click **"Settings"**
4. Add these **Secrets**:

```
TELEGRAM_BOT_TOKEN=8318381464:AAH2YMr_oZP8f27UZ1q2l7I0_eOaIaIFVWI
RIDERS_GROUP_ID=-1001003046741577
```

### Or using CLI:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=8318381464:AAH2YMr_oZP8f27UZ1q2l7I0_eOaIaIFVWI
supabase secrets set RIDERS_GROUP_ID=-1001003046741577
```

## Step 3: Set Telegram Webhook

Your webhook URL will be:
```
https://ojuhzknpzxneilvxhlcm.supabase.co/functions/v1/telegram-callback
```

Set it with this command:

```bash
curl -X POST "https://api.telegram.org/bot8318381464:AAH2YMr_oZP8f27UZ1q2l7I0_eOaIaIFVWI/setWebhook" \
  -d "url=https://ojuhzknpzxneilvxhlcm.supabase.co/functions/v1/telegram-callback"
```

Verify it's set:
```bash
curl https://api.telegram.org/bot8318381464:AAH2YMr_oZP8f27UZ1q2l7I0_eOaIaIFVWI/getWebhookInfo
```

## Step 4: Run the SQL Migration

Go to Supabase SQL Editor and run:

```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_telegram_chat_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS accepted_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pending';

UPDATE orders 
SET status = 'Pending' 
WHERE status IS NULL;
```

## Step 5: Test It!

1. Go to admin dashboard: `#/admin`
2. Click "Send to Riders" on an order
3. Check your Telegram riders group
4. Click "Accept" button
5. Customer should get notified automatically! ✅

## Troubleshooting

### Check Function Logs:
Go to **Edge Functions** → **telegram-callback** → **Logs** to see what's happening

### Verify Database Columns:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN ('customer_telegram_chat_id', 'accepted_by', 'status');
```

## ✅ Done!

Your Telegram webhook is now handled by Supabase Edge Functions!

