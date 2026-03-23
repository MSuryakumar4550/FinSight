import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllExpenses, getMonthlySummary, getUserSettings } from '../api';
import './Dashboard.css';

const USER_ID = 1;

const BAR_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#06B6D4'
];

function Dashboard() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [aiTip, setAiTip]       = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [budget, setBudget]     = useState(5000);

  useEffect(() => {
    getUserSettings(USER_ID)
      .then((res) => {
        const bgt = res.data?.budget || 5000;
        setBudget(bgt);
        fetchData(bgt);
      })
      .catch(() => fetchData(5000));
  }, []);

  const fetchData = async (bgt = 5000) => {
    try {
      setLoading(true);
      const expRes = await getAllExpenses(USER_ID);
      setExpenses(expRes.data);

      const now = new Date();
      const sumRes = await getMonthlySummary(
        USER_ID,
        now.getMonth() + 1,
        now.getFullYear(),
        bgt
      );
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAITip = async () => {
    if (!summary) return;
    setAiLoading(true);

    const breakdown = Object.entries(
      summary.categoryBreakdown || {}
    ).map(([k, v]) => `${k}: ₹${v}`).join(', ');

    const prompt = `
You are a personal finance advisor.
User expense data:
- Total Spent: ₹${summary.totalSpent}
- Budget: ₹${summary.monthlyBudget}
- Remaining: ₹${summary.remaining}
- Budget Exceeded: ${summary.budgetExceeded ? 'Yes' : 'No'}
- Categories: ${breakdown}
Give ONE short practical money-saving tip in 1-2 sentences.
Be specific to their numbers. Plain text only, no formatting.
    `;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = await res.json();
      const text = data.candidates[0].content.parts[0].text;
      setAiTip(text.trim());
    } catch {
      setAiTip('Could not load tip. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  const budgetPercent = summary
    ? Math.min((summary.totalSpent / summary.monthlyBudget) * 100, 100)
    : 0;

  const topCategory = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown)
        .sort((a, b) => b[1] - a[1])[0]
    : null;

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  const categoryEntries = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
    : [];

  const maxAmount = categoryEntries.length > 0
    ? categoryEntries[0][1] : 1;

  return (
    <div className="dashboard">

      {summary?.budgetExceeded && (
        <div className="alert-bar">
          Budget exceeded by ₹{Math.abs(summary.remaining).toLocaleString()}!
          Reduce spending immediately.
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">{t('totalSpent')}</div>
          <div className={`stat-value ${
            summary?.budgetExceeded ? 'red' : 'accent'}`}>
            ₹{summary?.totalSpent?.toLocaleString() || 0}
          </div>
          <span className={`stat-badge ${
            summary?.budgetExceeded ? 'badge-red' : 'badge-green'}`}>
            {summary?.budgetExceeded ? 'Over budget' : 'Within budget'}
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('budget')}</div>
          <div className="stat-value">
            ₹{budget.toLocaleString()}
          </div>
          <div className="budget-bar-track">
            <div
              className="budget-bar-fill"
              style={{
                width: `${budgetPercent}%`,
                background: budgetPercent >= 100
                  ? '#EF4444' : budgetPercent >= 80
                  ? '#F59E0B' : '#10B981'
              }}
            />
          </div>
          <div className="budget-meta">
            <span>{budgetPercent.toFixed(0)}% used</span>
            <span>₹{summary?.remaining?.toLocaleString()} left</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Top Category</div>
          <div className="stat-value accent" style={{ fontSize: '18px' }}>
            {topCategory ? topCategory[0] : 'None'}
          </div>
          {topCategory && (
            <span className="stat-badge badge-accent">
              ₹{topCategory[1].toLocaleString()} —{' '}
              {((topCategory[1] / summary.totalSpent) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      <div className="ai-banner">
        <div className="ai-banner-left">
          <div className="ai-banner-title">✦ AI Spending Coach</div>
          <div className="ai-banner-text">
            {aiTip || 'Get personalised advice based on your real spending data.'}
          </div>
        </div>
        <button
          className="ai-banner-btn"
          onClick={getAITip}
          disabled={aiLoading}>
          {aiLoading ? 'Thinking...' : 'Get AI Advice'}
        </button>
      </div>

      <div className="bottom-grid">
        <div className="dash-card">
          <div className="dash-card-title">{t('categoryBreakdown')}</div>
          {categoryEntries.length === 0
            ? <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                No data yet
              </p>
            : categoryEntries.map(([cat, amt], i) => (
              <div key={cat} className="bar-row">
                <span className="bar-label">{cat}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(amt / maxAmount) * 100}%`,
                      background: BAR_COLORS[i % BAR_COLORS.length]
                    }}
                  />
                </div>
                <span className="bar-amount">₹{amt.toLocaleString()}</span>
              </div>
            ))
          }
        </div>

        <div className="dash-card">
          <div className="dash-card-title">Recent Expenses</div>
          {recentExpenses.length === 0
            ? <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {t('noExpenses')}
              </p>
            : recentExpenses.map(exp => (
              <div key={exp.id} className="exp-row">
                <div>
                  <div className="exp-title">{exp.title}</div>
                  <div className="exp-meta">
                    {exp.category} • {exp.date}
                  </div>
                </div>
                <div className="exp-amount">
                  ₹{exp.amount?.toLocaleString()}
                </div>
              </div>
            ))
          }
        </div>
      </div>

    </div>
  );
}

export default Dashboard;