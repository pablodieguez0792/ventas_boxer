const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

export const chatApi = {
  async send({ conversationId, message }) {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message }),
    });
    if (!res.ok) throw new Error('Chat API error');
    return res.json();
  },
  async seed() {
    const res = await fetch(`${API_BASE}/api/seed_chatbot`, { method: 'POST' });
    if (!res.ok) throw new Error('Seed API error');
    return res.json();
  },
  async listConversations() {
    const res = await fetch(`${API_BASE}/api/conversations`);
    if (!res.ok) throw new Error('List conversations error');
    return res.json();
  },
  async getConversation(id) {
    const res = await fetch(`${API_BASE}/api/conversations/${id}`);
    if (!res.ok) throw new Error('Get conversation error');
    return res.json();
  },
};
