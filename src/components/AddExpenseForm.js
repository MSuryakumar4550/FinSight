import { useState } from 'react';
import { addExpense } from '../api';

function AddExpenseForm({ onExpenseAdded }) {
  const [form, setForm] = useState({
    title: '', amount: '', category: 'FOOD',
    description: '', date: '', userId: 1
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addExpense({
        ...form,
        amount: parseFloat(form.amount)
      });
      alert('Expense added!');
      onExpenseAdded();
      setForm({ title: '', amount: '',
        category: 'FOOD', description: '',
        date: '', userId: 1 });
    } catch (err) {
      alert('Error adding expense');
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Add Expense</h3>
      <form onSubmit={handleSubmit}>
        <input style={styles.input} name="title"
          placeholder="Title" value={form.title}
          onChange={handleChange} required />
        <input style={styles.input} name="amount"
          type="number" placeholder="Amount"
          value={form.amount}
          onChange={handleChange} required />
        <select style={styles.input} name="category"
          value={form.category}
          onChange={handleChange}>
          {['FOOD','TRAVEL','SHOPPING',
            'BILLS','ENTERTAINMENT','OTHER']
            .map(c => <option key={c}>{c}</option>)}
        </select>
        <input style={styles.input} name="date"
          type="date" value={form.date}
          onChange={handleChange} required />
        <input style={styles.input} name="description"
          placeholder="Description (optional)"
          value={form.description}
          onChange={handleChange} />
        <button style={styles.btn} type="submit">
          Add Expense
        </button>
      </form>
    </div>
  );
}

const styles = {
  card:{background:'#fff',padding:'20px',
    borderRadius:'8px',border:'1px solid #eee'},
  heading:{margin:'0 0 16px',fontSize:'16px'},
  input:{display:'block',width:'100%',padding:'8px',
    marginBottom:'10px',borderRadius:'6px',
    border:'1px solid #ddd',fontSize:'14px',
    boxSizing:'border-box'},
  btn:{width:'100%',padding:'10px',background:'#4F46E5',
    color:'#fff',border:'none',borderRadius:'6px',
    fontSize:'14px',cursor:'pointer'}
};

export default AddExpenseForm;
