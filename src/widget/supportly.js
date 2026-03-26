(function() {
  // Find the script tag to get config
  const script = document.currentScript || document.querySelector('script[data-key]');
  if (!script) return console.error('Supportly: Missing data-key attribute');

  const API_KEY = script.getAttribute('data-key');
  const BASE_URL = script.src.replace('/widget/supportly.js', '');
  const PRIMARY = script.getAttribute('data-color') || '#0099ff';
  const POSITION = script.getAttribute('data-position') || 'right';

  let sessionId = sessionStorage.getItem('supportly_session') || null;
  let isOpen = false;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #supportly-widget * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

    #supportly-toggle {
      position: fixed; bottom: 20px; ${POSITION}: 20px; width: 60px; height: 60px;
      border-radius: 50%; background: ${PRIMARY}; border: none; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    #supportly-toggle:hover { transform: scale(1.1); }
    #supportly-toggle svg { width: 28px; height: 28px; fill: #fff; }

    #supportly-chat {
      position: fixed; bottom: 90px; ${POSITION}: 20px; width: 380px; max-width: calc(100vw - 40px);
      height: 500px; max-height: calc(100vh - 120px);
      background: #fff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 99999; display: none; flex-direction: column; overflow: hidden;
    }
    #supportly-chat.open { display: flex; }

    .supportly-header {
      background: ${PRIMARY}; color: #fff; padding: 1rem; display: flex;
      justify-content: space-between; align-items: center;
    }
    .supportly-header h3 { font-size: 1rem; font-weight: 600; }
    .supportly-header button { background: none; border: none; color: #fff; cursor: pointer; font-size: 1.2rem; }

    .supportly-messages {
      flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem;
    }

    .supportly-msg {
      max-width: 80%; padding: 0.7rem 1rem; border-radius: 12px; font-size: 0.9rem; line-height: 1.4;
      word-wrap: break-word;
    }
    .supportly-msg.bot { background: #f0f0f0; color: #333; align-self: flex-start; border-bottom-left-radius: 4px; }
    .supportly-msg.user { background: ${PRIMARY}; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
    .supportly-msg.typing { background: #f0f0f0; color: #999; }

    .supportly-input {
      display: flex; border-top: 1px solid #eee; padding: 0.5rem;
    }
    .supportly-input input {
      flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 0.6rem 0.8rem;
      font-size: 0.9rem; outline: none;
    }
    .supportly-input input:focus { border-color: ${PRIMARY}; }
    .supportly-input button {
      background: ${PRIMARY}; color: #fff; border: none; border-radius: 8px;
      padding: 0.6rem 1rem; margin-left: 0.5rem; cursor: pointer; font-weight: 600;
    }

    .supportly-powered {
      text-align: center; padding: 0.4rem; font-size: 0.7rem; color: #999;
    }
    .supportly-powered a { color: #999; text-decoration: none; }
  `;
  document.head.appendChild(style);

  // Create widget HTML
  const container = document.createElement('div');
  container.id = 'supportly-widget';
  container.innerHTML = `
    <button id="supportly-toggle">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </button>
    <div id="supportly-chat">
      <div class="supportly-header">
        <h3>Support Chat</h3>
        <button onclick="document.getElementById('supportly-chat').classList.remove('open')">✕</button>
      </div>
      <div class="supportly-messages" id="supportly-messages">
        <div class="supportly-msg bot">Hi! How can I help you today?</div>
      </div>
      <div class="supportly-input">
        <input type="text" id="supportly-input" placeholder="Type a message..." />
        <button id="supportly-send">Send</button>
      </div>
      <div class="supportly-powered">Powered by <a href="${BASE_URL}" target="_blank">Supportly</a></div>
    </div>
  `;
  document.body.appendChild(container);

  // Toggle chat
  document.getElementById('supportly-toggle').addEventListener('click', () => {
    const chat = document.getElementById('supportly-chat');
    isOpen = !isOpen;
    chat.classList.toggle('open', isOpen);
    if (isOpen) document.getElementById('supportly-input').focus();
  });

  // Send message
  async function sendMessage() {
    const input = document.getElementById('supportly-input');
    const message = input.value.trim();
    if (!message) return;

    const messages = document.getElementById('supportly-messages');

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'supportly-msg user';
    userMsg.textContent = message;
    messages.appendChild(userMsg);
    input.value = '';

    // Add typing indicator
    const typing = document.createElement('div');
    typing.className = 'supportly-msg bot typing';
    typing.textContent = 'Typing...';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch(BASE_URL + '/api/chat/' + API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId }),
      });
      const data = await res.json();
      sessionId = data.sessionId;
      sessionStorage.setItem('supportly_session', sessionId);

      typing.remove();

      const botMsg = document.createElement('div');
      botMsg.className = 'supportly-msg bot';
      botMsg.textContent = data.reply;
      messages.appendChild(botMsg);
    } catch (err) {
      typing.remove();
      const errMsg = document.createElement('div');
      errMsg.className = 'supportly-msg bot';
      errMsg.textContent = 'Sorry, I had trouble connecting. Please try again.';
      messages.appendChild(errMsg);
    }

    messages.scrollTop = messages.scrollHeight;
  }

  document.getElementById('supportly-send').addEventListener('click', sendMessage);
  document.getElementById('supportly-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();
