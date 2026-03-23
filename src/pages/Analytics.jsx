import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { getAllExpenses, getMonthlySummary } from "../api";
import { getBudget } from "../utils/budget";
import "./Analytics.css";

const USER_ID = 1;
const BUDGET = getBudget();

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

const CATEGORY_COLORS = {
  FOOD:          "#6366f1",
  TRAVEL:        "#06b6d4",
  SHOPPING:      "#f59e0b",
  BILLS:         "#ef4444",
  ENTERTAINMENT: "#8b5cf6",
  OTHER:         "#10b981",
};

export default function Analytics() {
  const { t } = useTranslation();
  const [expenses, setExpenses]     = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);

  const now        = new Date();
  const thisMonth  = now.getMonth() + 1;
  const thisYear   = now.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expData, sumData] = await Promise.all([
          getAllExpenses(USER_ID),
          getMonthlySummary(USER_ID, thisMonth, thisYear, BUDGET),
        ]);
        setExpenses(expData.data || []);
        setSummary(sumData.data || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [thisMonth, thisYear]);

  // ── Derived data ─────────────────────────────────

  // Month-wise bar chart: group all expenses by month
  const monthlyMap = {};
  expenses.forEach((exp) => {
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + exp.amount;
  });
  const monthlyData = Object.entries(monthlyMap)
    .map(([key, total]) => {
      const [yr, mo] = key.split("-");
      return { name: `${MONTH_NAMES[+mo]} '${String(yr).slice(2)}`, total };
    })
    .sort((a, b) => {
      const toDate = (s) => {
        const [m, y] = s.name.split(" ");
        return new Date(`20${y.replace("'","")}`, MONTH_NAMES.indexOf(m));
      };
      return toDate(a) - toDate(b);
    });

  // Daily line chart: current month
  const dailyMap = {};
  expenses
    .filter((exp) => {
      const d = new Date(exp.date);
      return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
    })
    .forEach((exp) => {
      const day = new Date(exp.date).getDate();
      dailyMap[day] = (dailyMap[day] || 0) + exp.amount;
    });
  const dailyData = Object.entries(dailyMap)
    .map(([day, amount]) => ({ day: `${day}`, amount }))
    .sort((a, b) => +a.day - +b.day);

  // Category donut
  const catBreakdown = summary?.categoryBreakdown || {};
  const donutData = Object.entries(catBreakdown).map(([cat, amt]) => ({
    name: cat,
    value: amt,
  }));

  // Top 3 categories
  const top3 = Object.entries(catBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Insight cards
  const totalSpent     = summary?.totalSpent || 0;
  const exceeded       = summary?.budgetExceeded || false;
  const remaining      = summary?.remaining || 0;

  const highestMonth   = monthlyData.reduce(
    (max, m) => (m.total > (max?.total || 0) ? m : max), null
  );
  const avgMonthly     = monthlyData.length
    ? Math.round(monthlyData.reduce((s, m) => s + m.total, 0) / monthlyData.length)
    : 0;
  const budgetHitCount = monthlyData.filter((m) => m.total > BUDGET).length;
  const topCategory    = top3[0] ? top3[0][0] : "—";

  const insightCards = [
    {
      icon: "📅",
      label: "Highest Spending Month",
      value: highestMonth ? highestMonth.name : "—",
      sub: highestMonth ? `Rs. ${highestMonth.total.toLocaleString("en-IN")}` : "",
      color: "var(--accent)",
    },
    {
      icon: "🏷️",
      label: "Most Spent Category",
      value: topCategory,
      sub: top3[0] ? `Rs. ${top3[0][1].toLocaleString("en-IN")}` : "",
      color: "#06b6d4",
    },
    {
      icon: "📊",
      label: "Avg Monthly Spend",
      value: `Rs. ${avgMonthly.toLocaleString("en-IN")}`,
      sub: `across ${monthlyData.length} month(s)`,
      color: "#8b5cf6",
    },
    {
      icon: "⚠️",
      label: "Budget Exceeded",
      value: `${budgetHitCount} month(s)`,
      sub: budgetHitCount > 0 ? "Review your spending" : "Great discipline!",
      color: budgetHitCount > 0 ? "#ef4444" : "#10b981",
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="an-tooltip">
          <p className="an-tooltip-label">{label}</p>
          <p className="an-tooltip-value">
            Rs. {payload[0].value?.toLocaleString("en-IN")}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="an-loading">
        <div className="an-spinner" />
        <p>Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="an-page">

      {/* ── Header ── */}
      <div className="an-header">
        <div>
          <h1 className="an-title">Analytics</h1>
          <p className="an-sub">Your spending story at a glance</p>
        </div>
        <div className="an-badge">
          {MONTH_NAMES[thisMonth - 1]} {thisYear}
        </div>
      </div>

      {/* ── Insight Cards ── */}
      <div className="an-cards">
        {insightCards.map((card, i) => (
          <div className="an-card" key={i} style={{ "--card-accent": card.color }}>
            <span className="an-card-icon">{card.icon}</span>
            <div className="an-card-body">
              <p className="an-card-label">{card.label}</p>
              <p className="an-card-value" style={{ color: card.color }}>
                {card.value}
              </p>
              <p className="an-card-sub">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1: Monthly Bar + Daily Line ── */}
      <div className="an-charts-row">

        <div className="an-chart-box">
          <h2 className="an-chart-title">📈 Monthly Spending</h2>
          {monthlyData.length === 0 ? (
            <p className="an-empty">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="an-chart-box">
          <h2 className="an-chart-title">📉 Daily Spending — This Month</h2>
          {dailyData.length === 0 ? (
            <p className="an-empty">No transactions this month</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                  label={{ value: "Day", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="amount" stroke="#06b6d4"
                  strokeWidth={2.5} dot={{ r: 4, fill: "#06b6d4" }}
                  activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ── Charts Row 2: Donut + Top 3 ── */}
      <div className="an-charts-row">

        <div className="an-chart-box">
          <h2 className="an-chart-title">🍩 Category Breakdown</h2>
          {donutData.length === 0 ? (
            <p className="an-empty">No category data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={CATEGORY_COLORS[entry.name] || "#6366f1"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `Rs. ${val.toLocaleString("en-IN")}`}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="an-chart-box">
          <h2 className="an-chart-title">🏆 Top 3 Categories</h2>
          {top3.length === 0 ? (
            <p className="an-empty">No data</p>
          ) : (
            <div className="an-top3">
              {top3.map(([cat, amt], i) => {
                const pct = totalSpent > 0
                  ? ((amt / totalSpent) * 100).toFixed(1) : 0;
                return (
                  <div className="an-top3-item" key={cat}>
                    <div className="an-top3-rank"
                      style={{ background: CATEGORY_COLORS[cat] || "var(--accent)" }}>
                      #{i + 1}
                    </div>
                    <div className="an-top3-info">
                      <div className="an-top3-row">
                        <span className="an-top3-cat">{cat}</span>
                        <span className="an-top3-amt">
                          Rs. {amt.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="an-top3-bar-bg">
                        <div
                          className="an-top3-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: CATEGORY_COLORS[cat] || "var(--accent)",
                          }}
                        />
                      </div>
                      <span className="an-top3-pct">{pct}% of total</span>
                    </div>
                  </div>
                );
              })}

              {/* Budget status */}
              <div className={`an-budget-status ${exceeded ? "exceeded" : "good"}`}>
                <span>{exceeded ? "⚠️ Over budget" : "✅ Within budget"}</span>
                <span>
                  {exceeded
                    ? `Overspent by Rs. ${Math.abs(remaining).toLocaleString("en-IN")}`
                    : `Rs. ${remaining.toLocaleString("en-IN")} remaining`}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}