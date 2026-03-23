import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAllExpenses,
  addExpense,
  deleteExpense,
  getMonthlySummary
} from '../api';
import './Expenses.css';
import { generatePDF } from '../utils/generatePDF';

const USER_ID = 1;
const CATEGORIES = [
  'FOOD','TRAVEL','SHOPPING',
  'BILLS','ENTERTAINMENT','OTHER'
];

function Expenses() {
  const { t } = useTranslation();
  const [expenses, setExpenses]       = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [summary, setSummary]         = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [success, setSuccess]         = useState('');
  const [form, setForm] = useState({
    title: '', amount: '', category: 'FOOD',
    date: '', description: '', userId: USER_ID
  });

  useEffect(() => { fetchExpenses(); }, []);

  useEffect(() => {
    if (categoryFilter === 'ALL') {
      setFiltered(expenses);
    } else {
      setFiltered(expenses.filter(e => e.category === categoryFilter));
    }
  }, [categoryFilter, expenses]);

  const fetchExpenses = async () => {
    try {
      const res = await getAllExpenses(USER_ID);
      const sorted = res.data.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setExpenses(sorted);

      const now = new Date();
      const sumRes = await getMonthlySummary(
        USER_ID, now.getMonth() + 1, now.getFullYear(), 5000
      );
      setSummary(sumRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addExpense({ ...form, amount: parseFloat(form.amount) });
      setSuccess('Expense added successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setForm({
        title: '', amount: '', category: 'FOOD',
        date: '', description: '', userId: USER_ID
      });
      fetchExpenses();
    } catch {
      alert('Error adding expense');
    }
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    fetchExpenses();
  };

  // ✅ Fixed: PDF downloads current month expenses only
  const handleDownloadPDF = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const currentMonthExpenses = expenses.filter((exp) => {
      const d = new Date(exp.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    generatePDF(currentMonthExpenses, summary, month, year);
  };

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <div className="expenses-title">{t('expenses')}</div>
        <button className="export-btn" onClick={handleDownloadPDF}>
          Download PDF Report
        </button>
      </div>

      <div className="expenses-grid">
        <div className="form-card">
          <div className="form-card-title">{t('addExpense')}</div>
          {success && <div className="success-msg">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('title')}</label>
              <input className="form-input" name="title"
                value={form.title} onChange={handleChange}
                placeholder="e.g. Lunch" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('amount')}</label>
              <input className="form-input" name="amount" type="number"
                value={form.amount} onChange={handleChange}
                placeholder="e.g. 250" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('category')}</label>
              <select className="form-input" name="category"
                value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('date')}</label>
              <input className="form-input" name="date" type="date"
                value={form.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('description')}</label>
              <input className="form-input" name="description"
                value={form.description} onChange={handleChange}
                placeholder="Optional" />
            </div>
            <button className="submit-btn" type="submit">
              {t('addExpense')}
            </button>
          </form>
        </div>

        <div className="list-card">
          <div className="list-header">
            <div className="list-title">
              {t('allExpenses')} ({filtered.length})
            </div>
          </div>
          <div className="filter-row">
            <select className="filter-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}>
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {filtered.length === 0
            ? <div className="empty-state">{t('noExpenses')}</div>
            : filtered.map(exp => (
              <div key={exp.id} className="exp-item">
                <div className="exp-left">
                  <div className="exp-name">{exp.title}</div>
                  <div className="exp-info">
                    {exp.date}
                    {exp.description && ` • ${exp.description}`}
                  </div>
                </div>
                <div className="exp-right">
                  <span className="cat-pill">{exp.category}</span>
                  <span className="exp-amt">
                    ₹{exp.amount?.toLocaleString()}
                  </span>
                  <button className="del-btn"
                    onClick={() => handleDelete(exp.id)}>
                    {t('deleteExpense')}
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export default Expenses;