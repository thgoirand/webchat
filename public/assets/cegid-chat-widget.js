/*
 * Cegid Chat Widget (Frontend-Only)
 * ------------------------------------------------------------
 * Drop this file on your site and load it with a <script src> tag.
 *
 * Usage (recommended):
 * <script>
 *   window.CegidChatConfig = {
 *     df: {
 *       // Your backend proxy that calls Dialogflow detectIntent
 *       endpoint: '/api/dialogflow',
 *       languageCode: 'fr'
 *     },
 *     brandColor: '#0046FF', // Cegid blue (tweak as needed)
 *     position: 'right',     // or 'left'
 *     greeting: "Bonjour ! Comment puis-je vous aider ?",
 *   };
 * </script>
 * <script src="/assets/cegid-chat-widget.js" defer></script>
 *
 * Notes:
 * - This widget only handles the UI. To talk to Dialogflow securely, you must expose
 *   a server endpoint (df.endpoint) that proxies requests to Dialogflow (to avoid
 *   exposing your Google credentials in the browser). The frontend POSTs {
 *     text, sessionId, languageCode, metadata
 *   } and expects back JSON { reply: string, raw?: any }.
 * - Fonts & theme are controlled via CSS variables below. Defaults are chosen to
 *   be close to Cegid's look & feel (clean, modern, bold brand blue).
 */

(function (w, d) {
  const DEFAULTS = {
    brandColor: '#0046FF',
    accentColor: '#FF3B30', // red dot
    textColor: '#0F172A',
    bgColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    radius: 16,
    shadow: '0 18px 48px rgba(2, 6, 23, 0.18)',
    position: 'right', // 'left' supported too
    zIndex: 2147483000,
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap',
    df: {
      endpoint: '/api/dialogflow',
      languageCode: 'fr',
      metadata: {}
    },
    greeting: 'Bonjour ! Comment puis-je vous aider ?',
    placeholder: 'Écrivez votre message…',
  };

  function uuidv4() {
    if (w.crypto && w.crypto.getRandomValues) {
      const a = w.crypto.getRandomValues(new Uint8Array(16));
      a[6] = (a[6] & 0x0f) | 0x40; // version
      a[8] = (a[8] & 0x3f) | 0x80; // variant
      const s = [...a].map((b, i) => (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') + b.toString(16).padStart(2, '0')).join('');
      return s;
    }
    // Fallback (less strong)
    let s = '', i = 0; while (i++ < 36) s += (i * 11117 % 16).toString(16); return s.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
  }

  function createStyles(cfg) {
    const css = `
      :host, .ccw { font-family: ${cfg.fontFamily}; }
      .ccw * { box-sizing: border-box; }

      .ccw-btn { position: fixed; bottom: 20px; ${cfg.position === 'left' ? 'left' : 'right'}: 20px; z-index: ${cfg.zIndex}; }

      .ccw-bubble { position: relative; display: grid; place-items: center; width: 64px; height: 64px; border-radius: 999px; background: ${cfg.brandColor}; box-shadow: ${cfg.shadow}; cursor: pointer; border: none; outline: none; }
      .ccw-bubble:focus-visible { box-shadow: 0 0 0 4px rgba(0,71,255,.2), ${cfg.shadow}; }
      .ccw-dot { position: absolute; top: -2px; right: -2px; width: 14px; height: 14px; background: ${cfg.accentColor}; border-radius: 999px; border: 2px solid #fff; }

      .ccw-logo { width: 34px; height: 34px; display: block; }

      .ccw-panel { position: fixed; bottom: 96px; ${cfg.position === 'left' ? 'left' : 'right'}: 20px; width: 360px; max-width: calc(100vw - 32px); height: 520px; max-height: calc(100vh - 120px); display: flex; flex-direction: column; background: ${cfg.bgColor}; border: 1px solid ${cfg.borderColor}; border-radius: ${cfg.radius}px; box-shadow: ${cfg.shadow}; overflow: hidden; z-index: ${cfg.zIndex}; opacity: 0; transform: translateY(12px) scale(.98); pointer-events: none; transition: opacity .18s ease, transform .18s ease; }
      .ccw-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

      .ccw-header { height: 56px; padding: 0 12px; background: #F8FAFC; border-bottom: 1px solid ${cfg.borderColor}; display: grid; grid-template-columns: 40px 1fr 32px; align-items: center; gap: 8px; }
      .ccw-brand { display: flex; align-items: center; gap: 8px; font-weight: 600; color: ${cfg.textColor}; }
      .ccw-brand .avatar { width: 28px; height: 28px; border-radius: 999px; background: ${cfg.brandColor}; display: grid; place-items: center; }
      .ccw-brand .avatar svg { width: 18px; height: 18px; }
      .ccw-title { font-size: 15px; letter-spacing: .2px; }

      .ccw-x { border: none; background: transparent; font-size: 22px; line-height: 1; cursor: pointer; color: #334155; padding: 4px; border-radius: 8px; }
      .ccw-x:hover { background: #E2E8F0; }

      .ccw-messages { flex: 1; overflow: auto; padding: 12px; background: #FFFFFF; }
      .ccw-msg { display: flex; gap: 8px; margin: 8px 0; }
      .ccw-msg .bubble { max-width: 78%; padding: 10px 12px; border-radius: 14px; font-size: 14px; line-height: 1.4; color: ${cfg.textColor}; background: #F1F5F9; }
      .ccw-msg.user { justify-content: flex-end; }
      .ccw-msg.user .bubble { background: ${cfg.brandColor}; color: #fff; border-bottom-right-radius: 4px; }
      .ccw-msg.bot .bubble { border-bottom-left-radius: 4px; }

      .ccw-typing { display: inline-flex; align-items: center; gap: 4px; padding: 10px 12px; background: #F1F5F9; border-radius: 14px; }
      .ccw-dotdotdot { width: 6px; height: 6px; border-radius: 999px; background: #94A3B8; animation: ccw-blink 1.2s infinite; }
      .ccw-dotdotdot:nth-child(2) { animation-delay: .2s; }
      .ccw-dotdotdot:nth-child(3) { animation-delay: .4s; }
      @keyframes ccw-blink { 0%, 80%, 100% { opacity: .2 } 40% { opacity: 1 } }

      .ccw-composer { padding: 10px; border-top: 1px solid ${cfg.borderColor}; background: #F8FAFC; display: grid; grid-template-columns: 1fr 88px; gap: 8px; }
      .ccw-input { resize: none; width: 100%; min-height: 44px; max-height: 140px; padding: 10px 12px; border-radius: 12px; border: 1px solid ${cfg.borderColor}; font-size: 14px; line-height: 1.35; outline: none; }
      .ccw-input:focus { border-color: ${cfg.brandColor}; box-shadow: 0 0 0 3px rgba(0,70,255,.15); }
      .ccw-send { border: none; border-radius: 12px; background: ${cfg.brandColor}; color: #fff; font-weight: 600; cursor: pointer; padding: 0 14px; }
      .ccw-send:disabled { opacity: .6; cursor: not-allowed; }

      /* Small screens */
      @media (max-width: 420px) {
        .ccw-panel { bottom: 88px; width: calc(100vw - 24px); height: calc(100vh - 140px); }
      }
    `;

    const style = d.createElement('style');
    style.textContent = css;

    // Load font if configured
    if (cfg.fontUrl) {
      const link = d.createElement('link');
      link.rel = 'stylesheet';
      link.href = cfg.fontUrl;
      return { style, link };
    }
    return { style };
  }

  function cegidLogoSVG(fill = '#FFFFFF') {
    // A simple "C" mark on a blue circle, used in both bubble and header avatar
    return `
      <svg class="ccw-logo" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <circle cx="20" cy="20" r="20" fill="currentColor"></circle>
        <path d="M28 12a10 10 0 1 0 0 16" fill="none" stroke="${fill}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  function html(cfg) {
    const wrap = d.createElement('div');
    wrap.className = 'ccw';
    wrap.innerHTML = `
      <div class="ccw-btn">
        <button class="ccw-bubble" aria-expanded="false" aria-controls="ccw-panel" title="Ouvrir le chat" style="color:${cfg.brandColor}">
          <span class="ccw-dot" aria-hidden="true"></span>
          ${cegidLogoSVG('#FFFFFF')}
        </button>
      </div>
      <section class="ccw-panel" id="ccw-panel" role="dialog" aria-label="Assistant Cegid" aria-modal="false">
        <header class="ccw-header">
          <span class="avatar" style="color:${cfg.brandColor}">${cegidLogoSVG('#FFFFFF')}</span>
          <div class="ccw-brand"><div class="ccw-title">Cegid Assistant</div></div>
          <button class="ccw-x" title="Fermer" aria-label="Fermer">×</button>
        </header>
        <main class="ccw-messages" aria-live="polite"></main>
        <form class="ccw-composer" novalidate>
          <textarea class="ccw-input" placeholder="${cfg.placeholder}"></textarea>
          <button class="ccw-send" type="submit">Envoyer</button>
        </form>
      </section>
    `;
    return wrap;
  }

  function init(config) {
    const cfg = deepMerge(DEFAULTS, config || {});

    // Host + Shadow DOM
    const host = d.createElement('div');
    host.id = 'cegid-chat-widget';
    d.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });

    // Styles
    const { style, link } = createStyles(cfg);

    // HTML
    const node = html(cfg);

    // Attach
    if (link) root.appendChild(link);
    root.appendChild(style);
    root.appendChild(node);

    const bubbleBtn = root.querySelector('.ccw-bubble');
    const panel = root.querySelector('.ccw-panel');
    const closeBtn = root.querySelector('.ccw-x');
    const messagesEl = root.querySelector('.ccw-messages');
    const form = root.querySelector('.ccw-composer');
    const input = root.querySelector('.ccw-input');
    const sendBtn = root.querySelector('.ccw-send');

    let open = false;
    let sending = false;
    const sessionId = (w.localStorage.getItem('ccw_session') || uuidv4());
    w.localStorage.setItem('ccw_session', sessionId);

    // Restore recent messages (optional simple store)
    const storeKey = 'ccw_msgs_v1';
    function loadStore() {
      try { return JSON.parse(w.localStorage.getItem(storeKey) || '[]'); } catch { return []; }
    }
    function saveStore(list) {
      try { w.localStorage.setItem(storeKey, JSON.stringify(list.slice(-100))); } catch {}
    }
    let history = loadStore();

    function renderHistory() {
      messagesEl.innerHTML = '';
      if (history.length === 0 && cfg.greeting) {
        pushBot(cfg.greeting);
        return;
      }
      history.forEach(m => {
        const el = d.createElement('div');
        el.className = `ccw-msg ${m.role}`;
        el.innerHTML = `<div class="bubble">${escapeHTML(m.text)}</div>`;
        messagesEl.appendChild(el);
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function escapeHTML(s) {
      return (s || '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#039;'}[c]));
    }

    function pushUser(text) {
      history.push({ role: 'user', text });
      saveStore(history);
      const el = d.createElement('div');
      el.className = 'ccw-msg user';
      el.innerHTML = `<div class="bubble">${escapeHTML(text)}</div>`;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function pushBot(text) {
      history.push({ role: 'bot', text });
      saveStore(history);
      const el = d.createElement('div');
      el.className = 'ccw-msg bot';
      el.innerHTML = `<div class="bubble">${escapeHTML(text)}</div>`;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
      const el = d.createElement('div');
      el.className = 'ccw-msg bot';
      el.dataset.typing = '1';
      el.innerHTML = `<div class="ccw-typing"><span class="ccw-dotdotdot"></span><span class="ccw-dotdotdot"></span><span class="ccw-dotdotdot"></span></div>`;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    function hideTyping() {
      const el = messagesEl.querySelector('[data-typing="1"]');
      if (el) el.remove();
    }

    function toggle(openState) {
      open = typeof openState === 'boolean' ? openState : !open;
      panel.classList.toggle('open', open);
      bubbleBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        setTimeout(() => input.focus(), 120);
      }
    }

    bubbleBtn.addEventListener('click', () => toggle(true));
    closeBtn.addEventListener('click', () => toggle(false));

    // Close on ESC
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) toggle(false);
    });

    // Auto-size textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    });

    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      input.style.height = '44px';
      pushUser(text);
      await talk(text);
    });

    // Shift+Enter for newline, Enter to send
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    async function talk(text) {
      sending = true; sendBtn.disabled = true; showTyping();
      try {
        const reply = await callDialogflow(cfg.df, { text, sessionId });
        hideTyping();
        pushBot(reply || "(Pas de réponse)");
      } catch (err) {
        hideTyping();
        pushBot("Désolé, une erreur est survenue. Réessayez plus tard.");
        console.error('[CegidChat] Dialogflow error', err);
      } finally {
        sending = false; sendBtn.disabled = false;
      }
    }

    // Initial render
    renderHistory();

    return {
      open: () => toggle(true),
      close: () => toggle(false),
      destroy: () => host.remove(),
      config: cfg,
    };
  }

  async function callDialogflow(dfCfg, payload) {
    const res = await fetch(dfCfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: payload.text,
        sessionId: payload.sessionId,
        languageCode: dfCfg.languageCode || 'fr',
        metadata: dfCfg.metadata || {}
      }),
      credentials: 'include'
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error('Dialogflow proxy error: ' + t);
    }
    const data = await res.json();
    // Expected shape: { reply: string, raw?: any }
    if (typeof data.reply === 'string') return data.reply;
    // Fallbacks for common DF payloads
    if (typeof data.fulfillmentText === 'string') return data.fulfillmentText;
    if (Array.isArray(data.fulfillmentMessages)) {
      const msg = data.fulfillmentMessages.find(m => m.text && Array.isArray(m.text.text));
      if (msg) return msg.text.text.join('\n');
    }
    return '(Réponse vide)';
  }

  function deepMerge(target, src) {
    const out = { ...target };
    for (const k in src) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) {
        out[k] = deepMerge(target[k] || {}, src[k]);
      } else {
        out[k] = src[k];
      }
    }
    return out;
  }

  // Expose globally
  w.CegidChat = { init };

  // Auto-init if a global config is set before the script tag
  if (w.CegidChatConfig) {
    try { w.CegidChat.init(w.CegidChatConfig); } catch (e) { console.error('[CegidChat] init failed', e); }
  }

})(window, document);