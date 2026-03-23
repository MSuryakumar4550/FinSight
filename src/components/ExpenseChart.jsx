import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './ExpenseChart.css';

const COLORS = [
  '#4F46E5', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#06B6D4'
];

function ExpenseChart({ summary }) {

  if (!summary || !summary.categoryBreakdown) {
    return (
      <div className="chart-container">
        <p className="no-data">No data to display</p>
      </div>
    );
  }

  const data = Object.entries(summary.categoryBreakdown)
    .map(([name, value]) => ({ name, value }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const renderCustomLabel = ({
    cx, cy, midAngle,
    innerRadius, outerRadius, percent
  }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x} y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="chart-container">
      <h3 className="chart-title">Spending by Category</h3>
      <div className="chart-wrapper">

        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`₹${value}`, 'Amount']}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="chart-legend">
          {data.map((entry, index) => (
            <div key={entry.name} className="legend-item">
              <div
                className="legend-dot"
                style={{ background: COLORS[index % COLORS.length] }}
              />
              <span className="legend-label">{entry.name}</span>
              <span className="legend-amount">₹{entry.value}</span>
              <span className="legend-percent">
                {total > 0
                  ? `${((entry.value / total) * 100).toFixed(0)}%`
                  : '0%'}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default ExpenseChart;