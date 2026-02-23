require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 5173;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "app")));

app.post("/api/summary", async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });
  }

  const { range, start, end, records } = req.body || {};
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "No records" });
  }

  const rangeText = range === "week" ? "本周" : range === "month" ? "本月" : range === "year" ? "本年" : "自定义";
  const dateText = start || end ? `（${start || ""} ~ ${end || ""}）` : "";

  const list = records
    .map((r, i) => {
      const tags = Array.isArray(r.tags) && r.tags.length ? r.tags.join("、") : "无";
      return `${i + 1}. 日期:${r.date || ""} | 情绪:${r.moodId || ""} | 标签:${tags}\n   记录:${r.text || ""}`;
    })
    .join("\n");

  const system = "你是一位中文写作者，擅长把零散日记进行总结。请将文本内容中的事项和情绪进行总结，多用量词，同时配上相符的总结文案。请不要杜撰没有的信息。";

  const user = `请根据以下日记记录写一篇回顾总结（100-300字），只输出正文。\n时间范围: ${rangeText}${dateText}\n记录条数: ${records.length}\n记录列表:\n${list}`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.7,
        max_tokens: 900,
        stream: false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "DeepSeek API error", detail: text });
    }

    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      return res.status(500).json({ error: "Empty summary" });
    }

    return res.json({ summary });
  } catch (err) {
    return res.status(500).json({ error: "Request failed" });
  }
});

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages" });
  }

  const system = "你是一位陪伴者，善解人意，能帮助用户消解负面情绪、开阔思路、分享快乐、缓解焦虑、分析问题并给出建议。语气自然温暖，像朋友一样交流。不要说教，不要机械，不要出现‘AI’或‘模型’相关措辞。";

  const chatMessages = [
    { role: "system", content: system },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content
    }))
  ];

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 600,
        stream: false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "DeepSeek API error", detail: text });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(500).json({ error: "Empty reply" });
    }

    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Request failed" });
  }
});

app.post("/api/chat/record", async (req, res) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages" });
  }

  const system = "你是一位中文写作者，擅长把对话中用户的叙述整理成一段日记记录。请只根据用户说过的内容整理，不要杜撰没有的信息。语气自然、克制、像真实日记。输出一段完整文字，不要列清单。";
  const user = `请把以下用户的对话内容整理成“今天的记录”，120-220字：\n${messages.map((m, i) => `${i + 1}. ${m}`).join("\n")}`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.6,
        max_tokens: 500,
        stream: false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "DeepSeek API error", detail: text });
    }

    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      return res.status(500).json({ error: "Empty summary" });
    }

    return res.json({ summary });
  } catch (err) {
    return res.status(500).json({ error: "Request failed" });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
