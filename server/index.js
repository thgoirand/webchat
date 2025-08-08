'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, cb) {
    if (!origin || allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: Origin not allowed'), false);
  },
  credentials: true
}));
app.use(express.json());

// Static demo & assets
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// Route: Dialogflow proxy
app.post('/api/dialogflow', async (req, res) => {
  try {
    const { text, sessionId, languageCode, metadata } = req.body || {};
    if (!text || !sessionId) {
      return res.status(400).json({ error: 'Missing text or sessionId' });
    }
    const type = (process.env.DIALOGFLOW_TYPE || 'es').toLowerCase();
    const lang = languageCode || process.env.DIALOGFLOW_LANGUAGE || 'fr';

    let reply = '';
    let raw = null;

    if (type === 'cx') {
      const { detectIntentCX } = require('./dialogflow-cx');
      ({ reply, raw } = await detectIntentCX({ text, sessionId, languageCode: lang, metadata }));
    } else {
      const { detectIntentES } = require('./dialogflow-es');
      ({ reply, raw } = await detectIntentES({ text, sessionId, languageCode: lang, metadata }));
    }

    res.json({ reply, raw });
  } catch (err) {
    console.error('[Dialogflow proxy] Error:', err);
    res.status(500).json({ error: 'Dialogflow proxy error' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});