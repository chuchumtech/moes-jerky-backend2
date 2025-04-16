const express = require('express');
const { Client, Environment } = require('square');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// ✅ Allow CORS from your Netlify domain
app.use(cors({
  origin: 'https://heartfelt-strudel-c08548.netlify.app'
}));

app.use(express.json());

// ✅ Square SDK setup
const client = new Client({
  environment: Environment.Sandbox, // change to Environment.Production when going live
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

// ✅ Payment endpoint
app.post('/payment', async (req, res) => {
  const { token, amount } = req.body;

  try {
    const response = await client.paymentsApi.createPayment({
      sourceId: token,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: Math.round(amount * 100), // convert dollars to cents
        currency: 'USD',
      },
    });

    // ✅ Fix: safely serialize BigInt values
    const cleanPayment = JSON.parse(JSON.stringify(response.result.payment, (_, val) =>
      typeof val === 'bigint' ? val.toString() : val
    ));

    res.json({ success: true, payment: cleanPayment });
  } catch (err) {
    console.error(err);
    const errorMessage = err?.errors?.[0]?.detail || err.message || 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// ✅ Simple homepage route
app.get('/', (req, res) => {
  res.send("Moe's Jerky backend is running");
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
