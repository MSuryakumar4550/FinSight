import { deleteExpense } from '../api';

function ExpenseList({ expenses, onDeleted }) {

  const handleDelete = async (id) => {
    await deleteExpense(id);
    onDeleted();
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>
        All Expenses ({expenses.length})
      </h3>
      {expenses.length === 0
        ? <p style={{color:'#888'}}>No expenses yet</p>
        : expenses.map(exp => (
          <div key={exp.id} style={styles.row}>
            <div>
              <div style={styles.title}>{exp.title}</div>
              <div style={styles.meta}>
                {exp.category} • {exp.date}
              </div>
            </div>
            <div style={styles.right}>
              <span style={styles.amount}>
                ₹{exp.amount}
              </span>
              <button style={styles.del}
                onClick={() => handleDelete(exp.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      }
    </div>
  );
}

const styles = {
  card:{background:'#fff',padding:'20px',
    borderRadius:'8px',border:'1px solid #eee'},
  heading:{margin:'0 0 16px',fontSize:'16px'},
  row:{display:'flex',justifyContent:'space-between',
    alignItems:'center',padding:'10px 0',
    borderBottom:'1px solid #f0f0f0'},
  title:{fontSize:'14px',fontWeight:'500'},
  meta:{fontSize:'12px',color:'#888',marginTop:'2px'},
  right:{display:'flex',alignItems:'center',gap:'10px'},
  amount:{fontSize:'15px',fontWeight:'500',
    color:'#4F46E5'},
  del:{background:'#fee2e2',color:'#dc2626',
    border:'none',borderRadius:'4px',
    padding:'4px 8px',cursor:'pointer',fontSize:'12px'}
};

export default ExpenseList;
