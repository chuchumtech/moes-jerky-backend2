const express = require('express');
const { Client, Environment } = require('square');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: 'https://heartfelt-strudel-c08548.netlify.app'
}));

app.use(express.json());

const client = new Client({
  environment: Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

// Path to a JSON file that simulates a database
const storeItemsPath = './storeItems.json';

function loadItems() {
  if (!fs.existsSync(storeItemsPath)) {
    fs.writeFileSync(storeItemsPath, JSON.stringify([
      { name: 'Original', price: 8.99 },
      { name: 'Spicy', price: 9.99 },
      { name: 'Teriyaki', price: 9.49 },
      { name: 'Pepper', price: 9.29 }
    ], null, 2));
  }
  return JSON.parse(fs.readFileSync(storeItemsPath));
}

function saveItems(items) {
  fs.writeFileSync(storeItemsPath, JSON.stringify(items, null, 2));
}

app.get('/items', (req, res) => {
  const items = loadItems();
  res.json(items);
});

app.post('/items', (req, res) => {
  const items = req.body;
  saveItems(items);
  res.json({ success: true });
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

app.get('/', (req, res) => {
  res.send("Moe's Jerky backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
