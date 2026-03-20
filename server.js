const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files from current directory
app.use(express.static(path.join(__dirname, '')));

// LLM Proxy Route
app.post('/api/chat', async (req, res) => {
    const { provider, model, messages } = req.body;
    try {
        let reply = "";
        if (provider === 'gemini') {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_KEY}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: messages })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            reply = data.candidates[0].content.parts[0].text;
        } else if (provider === 'claude') {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.CLAUDE_KEY, "anthropic-version": "2023-06-01" },
                body: JSON.stringify({ model, max_tokens: 2048, messages })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            reply = data.content[0].text;
        } else if (provider === 'groq') {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_KEY}` },
                body: JSON.stringify({ model, messages, max_tokens: 2048 })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            reply = data.choices[0].message.content;
        } else if (provider === 'openrouter') {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`, "HTTP-Referer": "https://localhost", "X-Title": "AI Assistant" },
                body: JSON.stringify({ model, messages })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            reply = data.choices[0].message.content;
        }
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/compare', async (req, res) => {
    const { provider, model, prompt } = req.body;
    try {
        let rawReply = "";
        if (provider === 'gemini') {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_KEY}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            rawReply = data.candidates[0].content.parts[0].text;
        } else if (provider === 'groq') {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_KEY}` },
                body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            rawReply = data.choices[0].message.content;
        } else if (provider === 'openrouter') {
             const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENROUTER_KEY}` },
                body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            rawReply = data.choices[0].message.content;
        }
        res.json({ reply: rawReply });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Catch-all to serve index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
