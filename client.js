// ─── State ─────────────────────────────────────────────────────────────────
let currentPersona = 'hitesh';
let sessionId = generateId();
let isLoading = false;

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Persona Config ─────────────────────────────────────────────────────────
const personas = {
  hitesh: {
    name: 'Hitesh Choudhary',
    subtitle: 'Chai aur Code · Online',
    avatarText: 'HC',
    avatarClass: 'hitesh-avatar',
    welcomeTitle: 'Hanji! Kya poochna hai? 🍵',
    welcomeSub: 'Hitesh Choudhary ke saath baat karo — coding, career, ya kuch bhi!',
    chips: [
      'DSA seekhne ka best tarika kya hai?',
      'Mujhe web development sikhao',
      'Job kaise milegi as a fresher?',
      'React vs Next.js — kya use karoon?',
    ],
  },
  piyush: {
    name: 'Piyush Garg',
    subtitle: 'Build. Ship. Learn. · Online',
    avatarText: 'PG',
    avatarClass: 'piyush-avatar',
    welcomeTitle: 'Dekho, kya seekhna hai? 🚀',
    welcomeSub: 'Piyush Garg ke saath baat karo — backend, startups, system design, aur zyada!',
    chips: [
      'System design kaise seekhoon?',
      'Node.js vs Bun — practical difference kya hai?',
      'SaaS product kaise banayein?',
      'Backend architecture best practices batao',
    ],
  },
};

// ─── Switch Persona ─────────────────────────────────────────────────────────
function switchPersona(persona) {
  if (currentPersona === persona) return;
  currentPersona = persona;

  // Update body class for CSS theming
  document.body.classList.toggle('piyush-mode', persona === 'piyush');

  // Sidebar buttons
  document.getElementById('btn-hitesh').classList.toggle('active', persona === 'hitesh');
  document.getElementById('btn-piyush').classList.toggle('active', persona === 'piyush');

  const p = personas[persona];

  // Header
  const headerAvatar = document.getElementById('header-avatar');
  headerAvatar.textContent = p.avatarText;
  headerAvatar.className = `header-avatar ${p.avatarClass}`;
  document.getElementById('header-name').textContent = p.name;
  document.getElementById('header-subtitle').textContent = p.subtitle;

  // Reset to welcome screen
  resetToWelcome();
}

function resetToWelcome() {
  const p = personas[currentPersona];
  const container = document.getElementById('messages-container');

  container.innerHTML = `
    <div class="welcome-screen" id="welcome-screen">
      <div class="welcome-avatar ${p.avatarClass}" id="welcome-avatar">${p.avatarText}</div>
      <h1 class="welcome-title" id="welcome-title">${p.welcomeTitle}</h1>
      <p class="welcome-sub" id="welcome-sub">${p.welcomeSub}</p>
      <div class="suggestion-chips" id="suggestion-chips">
        ${p.chips.map(c => `<button class="chip" onclick="sendSuggestion(this)">${c}</button>`).join('')}
      </div>
    </div>
  `;

  // Reset session on server
  fetch('/api/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  sessionId = generateId(); // new session
}

// ─── New Chat ───────────────────────────────────────────────────────────────
function newChat() {
  resetToWelcome();
}

// ─── Toggle Sidebar (mobile) ────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menu-toggle');
  if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
    sidebar.classList.remove('open');
  }
});

// ─── Input Handling ─────────────────────────────────────────────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function sendSuggestion(btn) {
  const text = btn.textContent;
  document.getElementById('user-input').value = text;
  sendMessage();
}

// ─── Send Message ────────────────────────────────────────────────────────────
async function sendMessage() {
  if (isLoading) return;

  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;

  // Clear welcome screen
  const welcome = document.getElementById('welcome-screen');
  if (welcome) welcome.remove();

  // Add user message
  appendUserMessage(message);
  input.value = '';
  input.style.height = 'auto';

  // Show thinking state
  isLoading = true;
  setUILoading(true);

  // Add thinking row (will be populated with steps)
  const thinkingRowId = 'thinking-' + generateId();
  const thinkingBlockId = 'block-' + generateId();
  const typingId = 'typing-' + generateId();

  appendThinkingRow(thinkingRowId, thinkingBlockId, typingId);

  // Stream from server
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, persona: currentPersona, sessionId }),
    });

    if (!response.ok) throw new Error('Server error: ' + response.status);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let outputText = '';
    let thinkingBlock = document.getElementById(thinkingBlockId);
    let typingEl = document.getElementById(typingId);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;

        let parsed;
        try { parsed = JSON.parse(data); } catch { continue; }

        const { step, text } = parsed;

        // Remove typing indicator once we get first real data
        if (typingEl) { typingEl.remove(); typingEl = null; }

        if (step === 'OUTPUT') {
          outputText = text;
        } else if (step === 'ERROR') {
          outputText = '❌ ' + text;
        } else {
          // Thinking step — append to thinking block
          appendThinkingStep(thinkingBlock, step, text);
          scrollToBottom();
        }
      }
    }

    // Remove thinking row, add final AI bubble
    const thinkingRow = document.getElementById(thinkingRowId);
    if (thinkingRow) thinkingRow.remove();

    if (outputText) {
      appendAIMessage(outputText);
    }

  } catch (err) {
    const thinkingRow = document.getElementById(thinkingRowId);
    if (thinkingRow) thinkingRow.remove();
    appendAIMessage('❌ Something went wrong: ' + err.message);
  }

  isLoading = false;
  setUILoading(false);
  scrollToBottom();
}

// ─── DOM Helpers ─────────────────────────────────────────────────────────────

function appendUserMessage(text) {
  const container = document.getElementById('messages-container');
  const row = document.createElement('div');
  row.className = 'message-row user-row';
  row.innerHTML = `
    <div class="msg-avatar user-avatar-icon">U</div>
    <div class="msg-bubble user-bubble">${escapeHtml(text)}</div>
  `;
  container.appendChild(row);
  scrollToBottom();
}

function appendThinkingRow(rowId, blockId, typingId) {
  const p = personas[currentPersona];
  const container = document.getElementById('messages-container');
  const row = document.createElement('div');
  row.id = rowId;
  row.className = 'message-row';
  row.innerHTML = `
    <div class="msg-avatar ${p.avatarClass}">${p.avatarText}</div>
    <div style="display:flex;flex-direction:column;gap:8px;flex:1;min-width:0;">
      <div class="thinking-block" id="${blockId}"></div>
      <div class="typing-indicator" id="${typingId}">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  container.appendChild(row);
  scrollToBottom();
}

function appendThinkingStep(block, step, text) {
  if (!block) return;
  const stepClass = getStepClass(step);
  const stepLabel = step.charAt(0) + step.slice(1).toLowerCase();
  const div = document.createElement('div');
  div.className = `thinking-step ${stepClass}`;
  div.innerHTML = `
    <span class="step-label">${stepLabel}</span>
    <span class="step-text">${escapeHtml(text)}</span>
  `;
  block.appendChild(div);
}

function appendAIMessage(text) {
  const p = personas[currentPersona];
  const container = document.getElementById('messages-container');
  const row = document.createElement('div');
  row.className = 'message-row';
  row.innerHTML = `
    <div class="msg-avatar ${p.avatarClass}">${p.avatarText}</div>
    <div class="msg-bubble ai-bubble">${formatMessage(text)}</div>
  `;
  container.appendChild(row);
}

function getStepClass(step) {
  const s = step.toUpperCase();
  if (s === 'INITIAL') return 'step-initial';
  if (s === 'THINK') return 'step-think';
  if (s === 'ANALYSE') return 'step-analyse';
  if (s.includes('TOOL')) return 'step-tool';
  return 'step-think';
}

function setUILoading(loading) {
  document.getElementById('send-btn').disabled = loading;
  document.getElementById('thinking-badge').style.display = loading ? 'flex' : 'none';
}

function scrollToBottom() {
  const container = document.getElementById('messages-container');
  container.scrollTop = container.scrollHeight;
}

// ─── Text Formatting ──────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMessage(text) {
  // Escape HTML first
  let out = escapeHtml(text);

  // Code blocks
  out = out.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code>${code.trim()}</code></pre>`
  );

  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Line breaks
  out = out.replace(/\n/g, '<br>');

  return out;
}
