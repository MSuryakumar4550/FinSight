import React, { useState, useEffect } from "react";
import { getAllExpenses, getMonthlySummary, getUserSettings } from "../api";
import { generatePDF } from "../utils/generatePDF";
import "./Reports.css";

const USER_ID = 1;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const CATEGORY_COLORS = {
  FOOD:          "#6366f1",
  TRAVEL:        "#06b6d4",
  SHOPPING:      "#f59e0b",
  BILLS:         "#ef4444",
  ENTERTAINMENT: "#8b5cf6",
  OTHER:         "#10b981",
};

export default function Reports() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [showPicker, setShowPicker]       = useState(false);
  const [expenses, setExpenses]           = useState([]);
  const [summary, setSummary]             = useState(null);
  const [loading, setLoading]             = useState(false);
  const [fetched, setFetched]             = useState(false);
  const [budget, setBudget]               = useState(5000);

  // Fetch budget from DB
  useEffect(() => {
    getUserSettings(USER_ID)
      .then((res) => { if (res.data?.budget) setBudget(res.data.budget); })
      .catch(() => setBudget(5000));
  }, []);

  const fetchReport = async (month, year, bgt = budget) => {
    setLoading(true);
    setFetched(false);
    try {
      const [expRes, sumRes] = await Promise.all([
        getAllExpenses(USER_ID),
        getMonthlySummary(USER_ID, month, year, bgt),
      ]);
      const allExp = expRes.data || [];
      const filtered = allExp.filter((exp) => {
        const d = new Date(exp.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      setExpenses(filtered);
      setSummary(sumRes.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  useEffect(() => {
    fetchReport(selectedMonth, selectedYear, budget);
  }, [budget]);

  const handleMonthSelect = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setShowPicker(false);
    fetchReport(month, year, budget);
  };

  const handleDownload = () => {
    if (!summary) return;
    generatePDF(expenses, summary, selectedMonth, selectedYear);
  };

  const totalSpent   = summary?.totalSpent    || 0;
  const monthBudget  = summary?.monthlyBudget || budget;
  const remaining    = summary?.remaining     || 0;
  const exceeded     = summary?.budgetExceeded || false;
  const usedPct      = monthBudget > 0 ? Math.min((totalSpent / monthBudget) * 100, 100) : 0;
  const catBreakdown = summary?.categoryBreakdown || {};
  const catEntries   = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y);

  return (
    <div className="rp-page">

      <div className="rp-topbar">
        <div className="rp-topbar-left">
          <h1 className="rp-title">Reports</h1>
          <p className="rp-sub">Monthly financial snapshot</p>
        </div>
        <div className="rp-topbar-right">
          <div className="rp-picker-wrap">
            <button className="rp-month-btn" onClick={() => setShowPicker(!showPicker)}>
              <span className="rp-month-btn-icon">📅</span>
              <span>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
              <span className="rp-chevron">{showPicker ? "▲" : "▼"}</span>
            </button>
            {showPicker && (
              <div className="rp-picker-dropdown">
                <div className="rp-picker-years">
                  {years.map((y) => (
                    <button key={y}
                      className={`rp-year-btn ${y === selectedYear ? "active" : ""}`}
                      onClick={() => setSelectedYear(y)}>
                      {y}
                    </button>
                  ))}
                </div>
                <div className="rp-picker-months">
                  {MONTH_NAMES.map((m, i) => {
                    const isFuture = selectedYear === now.getFullYear() && i + 1 > now.getMonth() + 1;
                    return (
                      <button key={m} disabled={isFuture}
                        className={`rp-month-cell ${i + 1 === selectedMonth ? "active" : ""} ${isFuture ? "disabled" : ""}`}
                        onClick={() => !isFuture && handleMonthSelect(i + 1, selectedYear)}>
                        {m.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button className="rp-download-btn" onClick={handleDownload}
            disabled={!fetched || loading || expenses.length === 0}>
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {loading && (
        <div className="rp-loading">
          <div className="rp-spinner" />
          <p>Fetching report…</p>
        </div>
      )}

      {fetched && !loading && expenses.length === 0 && (
        <div className="rp-empty">
          <span className="rp-empty-icon">🗂️</span>
          <p>No expenses found for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</p>
        </div>
      )}

      {fetched && !loading && expenses.length > 0 && (
        <>
          <div className="rp-cards">
            <div className="rp-card rp-card--spent">
              <p className="rp-card-label">Total Spent</p>
              <p className="rp-card-value">₹{totalSpent.toLocaleString("en-IN")}</p>
              <div className="rp-progress-bar">
                <div className="rp-progress-fill"
                  style={{ width: `${usedPct}%`, background: exceeded ? "#ef4444" : "#6366f1" }} />
              </div>
              <p className="rp-card-hint">{usedPct.toFixed(1)}% of budget used</p>
            </div>

            <div className="rp-card rp-card--budget">
              <p className="rp-card-label">Monthly Budget</p>
              <p className="rp-card-value">₹{monthBudget.toLocaleString("en-IN")}</p>
              <p className="rp-card-hint">Set for {MONTH_NAMES[selectedMonth - 1]}</p>
            </div>

            <div className={`rp-card ${exceeded ? "rp-card--danger" : "rp-card--safe"}`}>
              <p className="rp-card-label">{exceeded ? "Overspent By" : "Remaining"}</p>
              <p className="rp-card-value">₹{Math.abs(remaining).toLocaleString("en-IN")}</p>
              <p className="rp-card-hint">{exceeded ? "⚠️ Budget exceeded" : "✅ You're on track"}</p>
            </div>

            <div className="rp-card rp-card--txn">
              <p className="rp-card-label">Transactions</p>
              <p className="rp-card-value">{expenses.length}</p>
              <p className="rp-card-hint">
                Avg ₹{expenses.length > 0 ? Math.round(totalSpent / expenses.length).toLocaleString("en-IN") : 0} per txn
              </p>
            </div>
          </div>

          <div className="rp-section">
            <h2 className="rp-section-title">
              <span className="rp-section-line" />Category Breakdown
            </h2>
            <div className="rp-cat-table">
              <div className="rp-cat-head">
                <span>Category</span><span>Amount</span><span>Share</span><span>Level</span>
              </div>
              {catEntries.map(([cat, amt]) => {
                const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : 0;
                const level = amt > totalSpent * 0.5 ? "High" : amt > totalSpent * 0.25 ? "Medium" : "Low";
                const color = CATEGORY_COLORS[cat] || "#6366f1";
                return (
                  <div className="rp-cat-row" key={cat}>
                    <span className="rp-cat-name">
                      <span className="rp-cat-dot" style={{ background: color }} />{cat}
                    </span>
                    <span className="rp-cat-amt">₹{amt.toLocaleString("en-IN")}</span>
                    <span className="rp-cat-bar-wrap">
                      <span className="rp-cat-bar-bg">
                        <span className="rp-cat-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </span>
                      <span className="rp-cat-pct">{pct}%</span>
                    </span>
                    <span className={`rp-cat-level rp-level-${level.toLowerCase()}`}>{level}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rp-section">
            <h2 className="rp-section-title">
              <span className="rp-section-line" />All Transactions
            </h2>
            <div className="rp-txn-list">
              {[...expenses]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((exp, i) => (
                  <div className="rp-txn-row" key={exp.id || i}>
                    <div className="rp-txn-dot"
                      style={{ background: CATEGORY_COLORS[exp.category] || "#6366f1" }} />
                    <div className="rp-txn-info">
                      <p className="rp-txn-title">{exp.title}</p>
                      <p className="rp-txn-meta">
                        {exp.category} · {exp.date}
                        {exp.description && ` · ${exp.description}`}
                      </p>
                    </div>
                    <p className="rp-txn-amt"
                      style={{ color: CATEGORY_COLORS[exp.category] || "#6366f1" }}>
                      ₹{exp.amount?.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}