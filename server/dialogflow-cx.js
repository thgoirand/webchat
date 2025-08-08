'use strict';

const { SessionsClient } = require('@google-cloud/dialogflow-cx');

function getClientOptions() {
  const options = {};
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    options.credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    };
  }
  return options;
}

async function detectIntentCX({ text, sessionId, languageCode }) {
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const location = process.env.GOOGLE_LOCATION;
  const agentId = process.env.GOOGLE_AGENT_ID;
  if (!projectId || !location || !agentId) {
    throw new Error('Missing GOOGLE_PROJECT_ID, GOOGLE_LOCATION or GOOGLE_AGENT_ID for CX');
  }

  const client = new SessionsClient(getClientOptions());
  const sessionPath = client.projectLocationAgentSessionPath(projectId, location, agentId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: { text },
      languageCode
    }
  };

  const [response] = await client.detectIntent(request);

  let reply = '';
  const qr = response.queryResult;
  if (qr && Array.isArray(qr.responseMessages)) {
    const msg = qr.responseMessages.find(m => m.text && Array.isArray(m.text.text));
    if (msg) reply = msg.text.text.join('\n');
  }
  if (!reply && qr && typeof qr.transcript === 'string') {
    reply = qr.transcript;
  }
  if (!reply) reply = '(Réponse vide — CX)';

  return { reply, raw: response };
}

module.exports = { detectIntentCX };