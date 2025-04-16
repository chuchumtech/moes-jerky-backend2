const express = require('express');
const { Client, Environment } = require('square');
const cors = require('cors');
app.use(cors({
  origin: 'https://heartfelt-strudel-c08548.netlify.app'
}));
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
  environment: Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

app.post('/payment', async (req, res) => {
  const { token, amount } = req.body;

  try {
    const response = await client.paymentsApi.createPayment({
      sourceId: token,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: Math.round(amount * 100),
        currency: 'USD',
      },
    });

    res.json({ success: true, payment: response.result.payment });
  } catch (err) {
    console.error(err);
    const errorMessage = err?.errors?.[0]?.detail || err.message || 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.get('/', (req, res) => {
  res.send('Moe's Jerky Backend Running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
