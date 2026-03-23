function SummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Monthly Summary</h3>
      {summary.budgetExceeded && (
        <div style={styles.alert}>
          Budget exceeded by ₹{summary.overspentBy}!
        </div>
      )}
      <div style={styles.grid}>
        <div style={styles.stat}>
          <div style={styles.val}>
            ₹{summary.totalSpent}
          </div>
          <div style={styles.label}>Total Spent</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.val}>
            ₹{summary.monthlyBudget}
          </div>
          <div style={styles.label}>Budget</div>
        </div>
        <div style={styles.stat}>
          <div style={{...styles.val,
            color: summary.remaining < 0
              ? '#dc2626' : '#16a34a'}}>
            ₹{summary.remaining}
          </div>
          <div style={styles.label}>Remaining</div>
        </div>
      </div>
      <div style={styles.breakdown}>
        <div style={styles.bTitle}>
          Category Breakdown
        </div>
        {Object.entries(
          summary.categoryBreakdown || {})
          .map(([cat, amt]) => (
          <div key={cat} style={styles.bRow}>
            <span>{cat}</span>
            <span style={{fontWeight:'500'}}>
              ₹{amt}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  card:{background:'#fff',padding:'20px',
    borderRadius:'8px',border:'1px solid #eee',
    marginBottom:'16px'},
  heading:{margin:'0 0 16px',fontSize:'16px'},
  alert:{background:'#fee2e2',color:'#dc2626',
    padding:'10px',borderRadius:'6px',
    marginBottom:'12px',fontSize:'13px',
    fontWeight:'500'},
  grid:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',
    gap:'12px',marginBottom:'16px'},
  stat:{background:'#f8f9fa',padding:'12px',
    borderRadius:'6px',textAlign:'center'},
  val:{fontSize:'18px',fontWeight:'500',color:'#1e1e1e'},
  label:{fontSize:'11px',color:'#888',marginTop:'4px'},
  breakdown:{borderTop:'1px solid #f0f0f0',paddingTop:'12px'},
  bTitle:{fontSize:'12px',color:'#888',
    marginBottom:'8px',textTransform:'uppercase'},
  bRow:{display:'flex',justifyContent:'space-between',
    fontSize:'13px',padding:'4px 0'}
};

export default SummaryCard;