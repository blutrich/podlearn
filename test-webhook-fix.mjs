import crypto from 'crypto';
import https from 'https';

// Get a valid user ID from our check-production-tables.mjs output
const USER_ID = '07550722-a0aa-4705-b225-bf86f0c62a3a'; // Use an existing user ID from our database

// Create a test payload
const payload = {
  data: {
    id: 'evt_test_123',
    type: 'subscription',
    attributes: {
      store_id: 'store_123',
      customer_id: 'cus_123',
      status: 'active',
      test_mode: true
    }
  },
  meta: {
    event_name: 'subscription_updated',
    custom_data: {
      user_id: USER_ID,
      plan: 'pro'
    },
    test_mode: true
  }
};

// Convert payload to string
const payloadString = JSON.stringify(payload);

// Create HMAC signature using 'podclass' as secret
const secret = 'podclass';
const signature = crypto.createHmac('sha256', secret)
  .update(payloadString)
  .digest('hex');

// Webhook URL
const webhookUrl = 'https://httiyebjgxxwtgggkpgw.supabase.co/functions/v1/lemon-webhook';

console.log(`Testing webhook at: ${webhookUrl}`);
console.log(`Generated signature: ${signature}`);

// Create request options
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Signature': signature
  }
};

// Send the request
const req = https.request(webhookUrl, options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Response status: ${res.statusCode}`);
    try {
      const responseData = JSON.parse(data);
      console.log(`Response data: ${JSON.stringify(responseData, null, 2)}`);
    } catch (e) {
      console.log(`Response data: ${data}`);
    }
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

// Send the payload
req.write(payloadString);
req.end(); 