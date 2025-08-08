# Cegid Chat Widget (Frontend + Dialogflow Proxy)

A lightweight, brandable chat widget you can drop on any website. The UI lives fully in the browser (no framework needed) and talks to a **secure backend proxy** that forwards user messages to **Dialogflow (ES or CX)**.

## Repo structure

```
cegid-chat-widget/
├─ public/
│  ├─ assets/
│  │  └─ cegid-chat-widget.js        # The standalone UI widget (what you embed on your site)
│  └─ cegid-chat-widget-demo.html    # A demo page (uses /api/dialogflow)
├─ server/
│  ├─ index.js                       # Express server + CORS + route /api/dialogflow
│  ├─ dialogflow-es.js               # ES adapter
│  └─ dialogflow-cx.js               # CX adapter
├─ .env.example                      # Env configuration template (copy to .env)
├─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ README.md
├─ LICENSE
└─ .gitignore
```

## Quick start (local)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # fill the values (choose ES or CX)
   ```

3. **Run the server**
   ```bash
   npm start
   ```

4. Open the demo at **http://localhost:3000/cegid-chat-widget-demo.html** and click the blue bubble.

## Embed on your site

```html
<script>
  window.CegidChatConfig = {
    df: {
      endpoint: '/api/dialogflow',   // Your server proxy route
      languageCode: 'fr'
    },
    brandColor: '#0046FF',
    position: 'right',
    greeting: 'Bonjour ! Comment puis-je vous aider ?'
  };
</script>
<script src="/assets/cegid-chat-widget.js" defer></script>
```

> **Note:** Never call Dialogflow directly from the browser—keep credentials server-side.

## Environment variables

Copy `.env.example` to `.env` and fill required values. You can target **ES** *or* **CX** by setting `DIALOGFLOW_TYPE`.

### Common

- `PORT` — web server port (default 3000)
- `ALLOWED_ORIGINS` — comma-separated list for CORS (e.g. `https://www.cegid.com,http://localhost:3000`)
- `DIALOGFLOW_TYPE` — `es` or `cx`
- `DIALOGFLOW_LANGUAGE` — `fr` (default)

### Dialogflow ES

- `GOOGLE_PROJECT_ID` — GCP project id hosting the ES agent
- One of the following auth options:
  - `GOOGLE_APPLICATION_CREDENTIALS` — absolute path to a service account JSON
  - **or** inline creds: `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY` (use `\n` for newlines)

### Dialogflow CX

- `GOOGLE_PROJECT_ID` — GCP project id
- `GOOGLE_LOCATION` — region like `europe-west1` or `us-central1`
- `GOOGLE_AGENT_ID` — Dialogflow CX agent UUID
- Same auth options as ES above

## Docker

```bash
docker build -t cegid-chat .
docker run --env-file .env -p 3000:3000 cegid-chat
```

## Security notes

- Restrict `ALLOWED_ORIGINS` in production.
- Rate-limit or add auth to `/api/dialogflow` if exposed publicly.
- Keep service account credentials out of the repo; use secrets.

## License

MIT