'use strict';

const dialogflow = require('@google-cloud/dialogflow');

function getClientOptions() {
  const options = {};
  // Option A: GOOGLE_APPLICATION_CREDENTIALS (path) -> let the SDK pick it up automatically
  // Option B: Inline credentials
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    options.credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    };
  }
  return options;
}

async function detectIntentES({ text, sessionId, languageCode }) {
  const projectId = process.env.GOOGLE_PROJECT_ID;
  if (!projectId) throw new Error('Missing GOOGLE_PROJECT_ID');

  const client = new dialogflow.SessionsClient(getClientOptions());
  const sessionPath = client.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: { text, languageCode }
    }
  };

  const [response] = await client.detectIntent(request);
  const result = response.queryResult || {};
  let reply = result.fulfillmentText || '';

  if (!reply && Array.isArray(result.fulfillmentMessages)) {
    const t = result.fulfillmentMessages.find(m => m.text && Array.isArray(m.text.text));
    if (t) reply = t.text.text.join('\n');
  }
  if (!reply) reply = '(Réponse vide — ES)';

  return { reply, raw: response };
}

module.exports = { detectIntentES };