import React, { useState, useEffect, useRef } from "react";
import { getAllExpenses, getMonthlySummary, getUserSettings } from "../api";
import "./AICoach.css";

const USER_ID = 1;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const QUICK_QUESTIONS = [
  "How can I reduce my travel expenses?",
  "Am I overspending this month?",
  "Give me a savings plan for next month",
  "Which category should I cut first?",
  "How does my spending compare to average?",
  "Give me 3 tips to stay within budget",
];

const TIP_CATEGORIES = [
  { icon: "🛒", label: "Shopping", color: "#f59e0b" },
  { icon: "🍔", label: "Food",     color: "#6366f1" },
  { icon: "✈️", label: "Travel",   color: "#06b6d4" },
  { icon: "💡", label: "Bills",    color: "#ef4444" },
];

async function callGemini(prompt) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
}

export default function AICoach() {
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear  = now.getFullYear();

  const [expenses, setExpenses]       = useState([]);
  const [summary, setSummary]         = useState(null);
  const [budget, setBudget]           = useState(5000);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tips, setTips]               = useState([]);
  const [dataReady, setDataReady]     = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [expRes, settingsRes] = await Promise.all([
          getAllExpenses(USER_ID),
          getUserSettings(USER_ID),
        ]);
        const bgt = settingsRes.data?.budget || 5000;
        setBudget(bgt);
        const allExp = expRes.data || [];
        setExpenses(allExp);

        const sumRes = await getMonthlySummary(USER_ID, thisMonth, thisYear, bgt);
        setSummary(sumRes.data || null);
        setDataReady(true);

        setMessages([{
          role: "ai",
          text: `👋 Hi! I'm your FinSight AI Coach.\n\nI've loaded ALL your transaction history — ${allExp.length} transactions across multiple months. Ask me anything about your finances!`,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        }]);
      } catch (e) {
        console.error(e);
        setDataReady(true);
        setMessages([{
          role: "ai",
          text: "👋 Hi! I'm your FinSight AI Coach. Ask me anything about budgeting and spending!",
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        }]);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Fixed: Full history context for all months
  const buildContext = () => {
    const totalSpent = summary?.totalSpent || 0;
    const remaining  = summary?.remaining  || 0;
    const exceeded   = summary?.budgetExceeded || false;
    const breakdown  = summary?.categoryBreakdown || {};
    const catSummary = Object.entries(breakdown)
      .map(([cat, amt]) => `${cat}: ₹${amt}`)
      .join(", ");

    // Group all expenses by month
    const monthlyMap = {};
    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + exp.amount;
    });
    const monthlyHistory = Object.entries(monthlyMap)
      .map(([month, amt]) => `${month}: ₹${amt}`)
      .join(", ");

    // All transactions for full context
    const allTransactions = expenses
      .slice(0, 20)
      .map((e) => `${e.date} - ${e.title} (${e.category}) ₹${e.amount}`)
      .join("\n");

    return `You are FinSight AI Coach, a friendly personal finance assistant for an Indian user.

CURRENT MONTH (${MONTH_NAMES[thisMonth - 1]} ${thisYear}):
- Budget: ₹${budget}
- Total Spent: ₹${totalSpent}
- Remaining: ₹${remaining} ${exceeded ? "(EXCEEDED)" : ""}
- Category Breakdown: ${catSummary || "No data"}

MONTHLY HISTORY (all months):
${monthlyHistory || "No history available"}

ALL TRANSACTIONS (recent 20):
${allTransactions || "No transactions"}

Give practical, specific, actionable advice using the full history above.
Keep responses concise (3-5 sentences). Use ₹. Be friendly and encouraging.
If asked about a specific month, use the monthly history data above.

User question: `;
  };

  const handleSend = async (text) => {
    const question = text || input.trim();
    if (!question) return;

    setMessages((prev) => [...prev, {
      role: "user", text: question,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setInput("");
    setLoading(true);

    try {
      const reply = await callGemini(buildContext() + question);
      setMessages((prev) => [...prev, {
        role: "ai", text: reply,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "ai",
        text: "Sorry, I couldn't connect to the AI. Please try again!",
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTips = async () => {
    setTipsLoading(true);
    setTips([]);
    try {
      const prompt = buildContext() +
        `Generate exactly 4 short budget saving tips for this user, one for each category: Shopping, Food, Travel, Bills.
        Format strictly as JSON array: [{"category":"Shopping","tip":"..."},{"category":"Food","tip":"..."},{"category":"Travel","tip":"..."},{"category":"Bills","tip":"..."}]
        Only return the JSON array, nothing else.`;
      const reply = await callGemini(prompt);
      const clean = reply.replace(/```json|```/g, "").trim();
      setTips(JSON.parse(clean));
    } catch {
      setTips([
        { category: "Shopping", tip: "Make a list before shopping and stick to it." },
        { category: "Food",     tip: "Cook at home 4 days a week to save significantly." },
        { category: "Travel",   tip: "Use public transport for short distances." },
        { category: "Bills",    tip: "Review subscriptions and cancel unused ones." },
      ]);
    } finally {
      setTipsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const totalSpent = summary?.totalSpent || 0;
  const exceeded   = summary?.budgetExceeded || false;

  return (
    <div className="ac-page">
      <div className="ac-header">
        <div className="ac-header-left">
          <div className="ac-avatar">✦</div>
          <div>
            <h1 className="ac-title">AI Coach</h1>
            <p className="ac-sub">Powered by Gemini · Your personal finance advisor</p>
          </div>
        </div>
        <div className={`ac-status ${dataReady ? "ready" : "loading"}`}>
          <span className="ac-status-dot" />
          {dataReady ? "Data loaded" : "Loading…"}
        </div>
      </div>

      {dataReady && (
        <div className="ac-snapshot">
          <div className="ac-snap-item">
            <span className="ac-snap-label">This Month</span>
            <span className="ac-snap-value">₹{totalSpent.toLocaleString("en-IN")}</span>
          </div>
          <div className="ac-snap-divider" />
          <div className="ac-snap-item">
            <span className="ac-snap-label">Budget</span>
            <span className="ac-snap-value">₹{budget.toLocaleString("en-IN")}</span>
          </div>
          <div className="ac-snap-divider" />
          <div className="ac-snap-item">
            <span className="ac-snap-label">Status</span>
            <span className={`ac-snap-badge ${exceeded ? "danger" : "safe"}`}>
              {exceeded ? "Over Budget" : "On Track"}
            </span>
          </div>
          <div className="ac-snap-divider" />
          <div className="ac-snap-item">
            <span className="ac-snap-label">Transactions</span>
            <span className="ac-snap-value">{expenses.length}</span>
          </div>
        </div>
      )}

      <div className="ac-main">
        <div className="ac-chat-panel">
          <div className="ac-chat-header">
            <span>💬 Chat with AI Coach</span>
          </div>
          <div className="ac-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ac-msg ac-msg--${msg.role}`}>
                {msg.role === "ai" && <div className="ac-msg-avatar">✦</div>}
                <div className="ac-msg-bubble">
                  <p className="ac-msg-text">{msg.text}</p>
                  <span className="ac-msg-time">{msg.time}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="ac-msg ac-msg--ai">
                <div className="ac-msg-avatar">✦</div>
                <div className="ac-msg-bubble ac-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="ac-quick">
            {QUICK_QUESTIONS.map((q, i) => (
              <button key={i} className="ac-quick-btn"
                onClick={() => handleSend(q)} disabled={loading}>
                {q}
              </button>
            ))}
          </div>
          <div className="ac-input-row">
            <textarea className="ac-input" rows={1}
              placeholder="Ask me about your spending…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button className="ac-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>

        <div className="ac-tips-panel">
          <div className="ac-tips-header">
            <span>💡 Saving Tips</span>
            <button className="ac-tips-btn"
              onClick={handleGenerateTips} disabled={tipsLoading}>
              {tipsLoading ? "Generating…" : "✦ Generate"}
            </button>
          </div>
          {tips.length === 0 && !tipsLoading && (
            <div className="ac-tips-empty">
              <p>Click <strong>Generate</strong> to get AI-powered saving tips based on your spending data!</p>
            </div>
          )}
          {tipsLoading && (
            <div className="ac-tips-loading">
              <div className="ac-tips-spinner" />
              <p>Analysing your spending…</p>
            </div>
          )}
          {tips.length > 0 && (
            <div className="ac-tips-list">
              {tips.map((tip, i) => {
                const cat = TIP_CATEGORIES.find(
                  (c) => c.label === tip.category
                ) || TIP_CATEGORIES[i % TIP_CATEGORIES.length];
                return (
                  <div className="ac-tip-card" key={i}
                    style={{ "--tip-color": cat.color }}>
                    <div className="ac-tip-icon">{cat.icon}</div>
                    <div className="ac-tip-body">
                      <p className="ac-tip-cat">{tip.category}</p>
                      <p className="ac-tip-text">{tip.tip}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="ac-monthly-tip">
            <p className="ac-monthly-label">📅 Monthly Challenge</p>
            <p className="ac-monthly-text">
              {exceeded
                ? `You've exceeded your budget by ₹${Math.abs(summary?.remaining || 0).toLocaleString("en-IN")}. Try a no-spend weekend to recover!`
                : `Great job staying within budget! Can you save ₹${Math.round(budget * 0.1).toLocaleString("en-IN")} extra this month?`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}