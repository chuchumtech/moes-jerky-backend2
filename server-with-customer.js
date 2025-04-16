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

// Paths to local storage JSON files
const storeItemsPath = './storeItems.json';
const ordersPath = './orders.json';

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

function loadOrders() {
  if (!fs.existsSync(ordersPath)) {
    fs.writeFileSync(ordersPath, JSON.stringify([], null, 2));
  }
  return JSON.parse(fs.readFileSync(ordersPath));
}

function saveOrder(order) {
  const orders = loadOrders();
  orders.push(order);
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
}

// GET store items
app.get('/items', (req, res) => {
  const items = loadItems();
  res.json(items);
});

// POST store items
app.post('/items', (req, res) => {
  const items = req.body;
  saveItems(items);
  res.json({ success: true });
});

// GET all orders
app.get('/orders', (req, res) => {
  const orders = loadOrders();
  res.json(orders);
});

// POST payment and store full order
app.post('/payment', async (req, res) => {
  const { token, amount, customer, cart } = req.body;

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

    const order = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      customer,
      items: cart,
      total: amount,
      paymentId: cleanPayment.id
    };

    saveOrder(order);

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
