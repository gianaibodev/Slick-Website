-- Add customer_telegram_chat_id column to orders table
-- Run this in your Supabase SQL Editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_telegram_chat_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS accepted_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pending';

-- Update existing orders to have default status
UPDATE orders 
SET status = 'Pending' 
WHERE status IS NULL;

