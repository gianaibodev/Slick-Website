import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '8318381464:AAH2YMr_oZP8f27UZ1q2l7I0_eOaIaIFVWI'
    const ridersGroupId = Deno.env.get('RIDERS_GROUP_ID') || '-1001003046741577'
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const update = await req.json()

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const query = update.callback_query
      const data = query.data
      const riderUserId = query.from.id.toString()
      const riderUsername = query.from.username || query.from.first_name

      console.log('Received callback:', data)

      // Handle order acceptance
      if (data && data.startsWith('accept_order_')) {
        const parts = data.split('_')
        const orderId = parts[2]
        const customerName = decodeURIComponent(parts.slice(3).join('_'))

        console.log('Processing acceptance for order:', orderId)

        // Get order from Supabase
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', parseInt(orderId))
          .single()

        if (orderError) {
          console.error('Error fetching order:', orderError)
          throw orderError
        }

        if (!order) {
          throw new Error('Order not found')
        }

        // Update order status
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'In Progress',
            accepted_by: riderUserId 
          })
          .eq('id', parseInt(orderId))

        if (updateError) {
          console.error('Error updating order:', updateError)
          throw updateError
        }

        // Send confirmation to customer
        const customerChatId = order.customer_telegram_chat_id
        
        if (customerChatId) {
          const customerMessage = 
            `✅ Great news, ${order.customer_name}! 🎉\n\n` +
            `Your order #${order.order_number} has been accepted! 🚴\n\n` +
            `A rider is now on the way to deliver your order.\n` +
            `You'll receive real-time updates as they approach.\n\n` +
            `Thank you for choosing Saucy Kitchen! 🍽️`

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: customerChatId,
              text: customerMessage,
              parse_mode: 'HTML'
            })
          })
        }

        // Answer the callback query
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: query.id,
            text: '✅ Order accepted! Customer notified.',
            show_alert: true
          })
        })

        // Notify riders group
        const ackMessage = `✅ Order #${order.order_number} accepted by @${riderUsername}! Rider is on the way.`
        
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ridersGroupId,
            text: ackMessage,
            parse_mode: 'HTML'
          })
        })

        return new Response(
          JSON.stringify({ 
            ok: true, 
            message: 'Order accepted successfully',
            orderId: orderId 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

