// Telegram Webhook Server - Run this to handle button clicks
// Usage: node telegram-webhook.js

const http = require('http');

const BOT_TOKEN = '8318381464:AAH2YMr_oZP8f27UZ1q2l7I0_eOaIaIFVWI';
const SUPABASE_URL = 'https://ojuhzknpzxneilvxhlcm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdWh6a25wenhuZWlsdnhobGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyOTU1NjUsImV4cCI6MjA3Njg3MTU2NX0.ngjHcMcDZarhe4wIDGU97MFWt5I7Rz-zsrboAaplyys';
const RIDERS_GROUP_ID = '-1001003046741577';

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    
    req.on('end', async () => {
      try {
        const update = JSON.parse(body);
        console.log('Received update:', JSON.stringify(update, null, 2));
        
        await handleUpdate(update);
        
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ok: true}));
      } catch (error) {
        console.error('Error processing update:', error);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: error.message}));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

async function handleUpdate(update) {
  // Handle callback queries (button clicks)
  if (update.callback_query) {
    const query = update.callback_query;
    const data = query.data;
    const riderUserId = query.from.id.toString();
    const riderUsername = query.from.username || query.from.first_name;

    console.log('Received callback:', data);

    // Handle order acceptance
    if (data && data.startsWith('accept_order_')) {
      const parts = data.split('_');
      const orderId = parts[2];
      const customerName = decodeURIComponent(parts.slice(3).join('_'));

      console.log('Processing acceptance for order:', orderId);

      // Get order from Supabase
      const orderResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=*`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const orders = await orderResponse.json();
      const order = orders[0];

      if (!order) {
        throw new Error('Order not found');
      }

      // Update order status
      await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          status: 'In Progress',
          accepted_by: riderUserId
        })
      });

      // Send confirmation to customer
      const customerChatId = order.customer_telegram_chat_id;
      
      if (customerChatId) {
        const customerMessage = 
          `✅ Great news, ${order.customer_name}! 🎉\n\n` +
          `Your order #${order.order_number} has been accepted! 🚴\n\n` +
          `A rider is now on the way to deliver your order.\n` +
          `You'll receive real-time updates as they approach.\n\n` +
          `Thank you for choosing Saucy Kitchen! 🍽️`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: customerChatId,
            text: customerMessage,
            parse_mode: 'HTML'
          })
        });
      }

      // Answer the callback query
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: query.id,
          text: '✅ Order accepted! Customer notified.',
          show_alert: true
        })
      });

      // Notify riders group
      const ackMessage = `✅ Order #${order.order_number} accepted by @${riderUsername}! Rider is on the way.`;
      
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: RIDERS_GROUP_ID,
          text: ackMessage,
          parse_mode: 'HTML'
        })
      });
    }
  }
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Telegram Webhook Server running on port ${PORT}`);
  console.log(`📡 You can use a service like ngrok to expose it:`);
  console.log(`   ngrok http ${PORT}`);
  console.log(`\nThen set the webhook with:`);
  console.log(`curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" -d "url=YOUR_NGROK_URL"\n`);
});

