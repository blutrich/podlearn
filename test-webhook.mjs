// Script to test webhook connection
import { createHmac } from 'crypto';

const WEBHOOK_URL = 'https://httiyebjgxxwtgggkpgw.supabase.co/functions/v1/lemon-webhook';
const WEBHOOK_SECRET = 'podclass';

async function testWebhook() {
  console.log(`Testing webhook at: ${WEBHOOK_URL}`);
  
  // Create a test payload
  const payload = {
    data: {
      id: 'test-order-123',
      type: 'order',
      attributes: {
        test_mode: true,
        total: 1000,
        currency: 'USD'
      }
    },
    meta: {
      event_name: 'order_created',
      test_mode: true,
      custom_data: {
        user_id: 'd7bed83c-44a0-4a4f-925f-efc531f68b2c',
        credits: '5'
      }
    }
  };
  
  // Convert to string
  const payloadString = JSON.stringify(payload);
  
  // Create signature using HMAC
  const signature = createHmac('sha256', WEBHOOK_SECRET)
    .update(payloadString)
    .digest('hex');
  
  console.log('Generated signature:', signature);
  
  try {
    // Send test webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature
      },
      body: payloadString
    });
    
    // Get response
    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('Response data:', responseJson);
    } catch {
      console.log('Response text:', responseText);
    }
    
  } catch (error) {
    console.error('Error sending test webhook:', error);
  }
}

// Run the function
testWebhook(); 