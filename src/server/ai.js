const OpenAI = require('openai');

let client = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_key_here') {
    return null;
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

async function generateAIReply(message, knowledge, welcomeMessage, chatHistory = []) {
  const openai = getClient();
  if (!openai) return null; // Fall back to keyword matching

  const systemPrompt = `You are a helpful customer support assistant. Answer questions using ONLY the knowledge base provided below. Be concise, friendly, and helpful. If the answer isn't in the knowledge base, say you'll connect them with a human agent.

KNOWLEDGE BASE:
${knowledge || 'No documents uploaded yet.'}

RULES:
- Only answer based on the knowledge base above
- Keep responses under 3 sentences
- Be friendly and professional
- If you can't find the answer, offer to connect with a human
- Never make up information not in the knowledge base`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map((msg) => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
    })),
    { role: 'user', content: message },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 200,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || null;
  } catch (err) {
    console.error('OpenAI API error:', err.message);
    return null; // Fall back to keyword matching
  }
}

module.exports = { generateAIReply };
