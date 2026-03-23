import { useState } from 'react';
import './AIAdvice.css';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`;
function AIAdvice({ summary }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [asked, setAsked] = useState(false);

  const getAdvice = async () => {
    if (!summary) return;

    setLoading(true);
    setError(null);
    setSuggestions([]);
    setAsked(true);

    const breakdown = Object.entries(
      summary.categoryBreakdown || {}
    )
      .map(([cat, amt]) => `${cat}: ₹${amt}`)
      .join(', ');
    const prompt = `
You are a personal finance advisor.
A user has the following expense data for this month:
- Total Spent: ₹${summary.totalSpent}
- Monthly Budget: ₹${summary.monthlyBudget}
- Remaining Budget: ₹${summary.remaining}
- Budget Exceeded: ${summary.budgetExceeded ? 'Yes' : 'No'}
- Category Breakdown: ${breakdown}

Give exactly 3 short, specific, practical money-saving suggestions 
based on this data. Each suggestion must be 1-2 sentences only.
Be direct and personalised to their actual numbers.
Return ONLY a JSON array of 3 strings. No extra text.
Example: ["suggestion 1", "suggestion 2", "suggestion 3"]
    `;

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      setSuggestions(parsed);

    } catch (err) {
      setError('Could not get AI advice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!summary) return null;

  return (
    <div className="ai-container">
      <div className="ai-header">
        <h3 className="ai-title">AI Spending Coach</h3>
        <span className="ai-badge">Personalized AI suggestions</span>
      </div>

      {!asked && (
        <button className="ai-btn" onClick={getAdvice}>
          Get AI Advice on My Spending
        </button>
      )}

      {loading && (
        <div className="ai-loading">
          <div className="spinner"></div>
          Analysing your spending...
        </div>
      )}

      {error && (
        <>
          <div className="ai-error">{error}</div>
          <button className="ai-refresh" onClick={getAdvice}>
            Try Again
          </button>
        </>
      )}

      {suggestions.length > 0 && (
        <>
          <div className="ai-suggestions">
            {suggestions.map((tip, index) => (
              <div key={index} className="suggestion-card">
                <div className="suggestion-num">{index + 1}</div>
                <p className="suggestion-text">{tip}</p>
              </div>
            ))}
          </div>
          <button className="ai-refresh" onClick={getAdvice}>
            Refresh Advice
          </button>
        </>
      )}
    </div>
  );
}

export default AIAdvice;