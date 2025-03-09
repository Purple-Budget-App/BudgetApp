require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session'); // Store access tokens
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const app = express();
app.use(cors({
  origin: '*', // Change this to a more secure domain in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
const admin = require('firebase-admin');
const serviceAccount = require('./purple-budget-firebase-adminsdk-fbsvc-1979621af8.json'); // Path to your Firebase private key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json'); // Force JSON response
  next();
});

// Setup Express Session (Store Access Token Persistently)
app.use(session({
  secret: '296989a919115afe69e45bb34534d9',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Change to `true` in production
}));

// Get today's date and 30 days ago dynamically
const today = new Date();
const startDate = new Date();
startDate.setDate(today.getDate() - 30);
const formatDate = (date) => date.toISOString().split('T')[0]; // YYYY-MM-DD

// Initialize Plaid Client
const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments.sandbox, // Change to 'development' or 'production' when live
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
        'Plaid-Version': '2020-09-14',
      },
    },
  })
);

// Route to Create Plaid Link Token
app.post('/create_link_token', async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'unique-user-id' },
      client_name: 'Budget App',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });

    console.log("✅ Plaid Link Token Response:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error creating link token:", error.response?.data || error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Route to Exchange Public Token for Access Token
app.post('/exchange_public_token', async (req, res) => {
  try {
    const { public_token, userId } = req.body; // Accept userId from frontend
    const response = await plaidClient.itemPublicTokenExchange({ public_token });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // 🔥 Save access token in Firestore under the user's document
    await db.collection('plaid_tokens').doc(userId).set({
      access_token: accessToken,
      item_id: itemId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Access token stored for user ${userId}`);
    res.json({ success: true, message: 'Access token saved successfully' });
  } catch (error) {
    console.error("❌ Error exchanging public token:", error.response?.data || error);
    res.status(500).json({ error: 'Failed to exchange public token' });
  }
});

// Route to Fetch Transactions
app.get('/transactions', async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from frontend

    // 🔥 Fetch the stored access token from Firestore
    const doc = await db.collection('plaid_tokens').doc(userId).get();
    if (!doc.exists) {
      return res.status(400).json({ error: 'No access token found for this user.' });
    }
    const accessToken = doc.data().access_token;

    // Fetch transactions from Plaid
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
    });

    console.log("✅ Transactions Retrieved:", response.data.transactions);
    res.json(response.data.transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions:", error.response?.data || error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});
app.post('/plaid-webhook', async (req, res) => {
  const webhookType = req.body.webhook_type;
  const webhookCode = req.body.webhook_code;

  if (webhookType === 'TRANSACTIONS' && webhookCode === 'SYNC_UPDATES_AVAILABLE') {
    const accessToken = req.session.access_token;
    // Trigger the /transactions/sync process to fetch new updates
  }

  res.sendStatus(200);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
