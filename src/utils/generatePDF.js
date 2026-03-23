import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoBase64 from "./logoBase64";

const ACCENT = [79, 70, 229];
const DARK = [26, 26, 46];
const WHITE = [255, 255, 255];
const LIGHT_GRAY = [245, 246, 250];
const RED = [239, 68, 68];
const GREEN = [16, 185, 129];
const AMBER = [245, 158, 11];

const MONTH_NAMES = [
  'January','February','March','April',
  'May','June','July','August',
  'September','October','November','December'
];

const addHeader = (doc, pageNum, month, year) => {
  const pageW = doc.internal.pageSize.getWidth();
  const logoWidth = 90;
  const logoHeight = 32;
  const logoX = 10;
  const logoY = (42 - 32) / 2;

  // ✅ Header bar tall enough for logo
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 42, 'F');

  // ✅ Logo — left aligned, properly sized
  doc.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight);
  // ✅ Right side text
  const now = new Date();
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated: ${now.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    })} at ${now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    })}`,
    pageW - 10, 14, { align: 'right' }
  );
  doc.text(
    `Period: ${MONTH_NAMES[month - 1]} ${year}`,
    pageW - 10, 22, { align: 'right' }
  );
  doc.text(
    `Page ${pageNum}`,
    pageW - 10, 30, { align: 'right' }
  );
};

const addFooter = (doc) => {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...ACCENT);
  doc.rect(0, pageH - 14, pageW, 14, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'FinSight — Smarter spending starts here.',
    pageW / 2, pageH - 6, { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 255);
  doc.text(
    'Confidential | Auto-generated report',
    12, pageH - 6
  );
};

const addSectionTitle = (doc, title, y) => {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text(title, 12, y);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.line(12, y + 2, pageW - 12, y + 2);
  return y + 8;
};

export const generatePDF = (expenses, summary, month, year) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();

  const totalSpent = summary?.totalSpent || 0;
  const budget = summary?.monthlyBudget || 5000;
  const remaining = summary?.remaining || 0;
  const exceeded = summary?.budgetExceeded || false;
  const usedPct = budget > 0
    ? ((totalSpent / budget) * 100).toFixed(1) : '0.0';

  const categoryEntries = Object.entries(
    summary?.categoryBreakdown || {}
  ).sort((a, b) => b[1] - a[1]);

  // ── PAGE 1 ──────────────────────────────────────
  addHeader(doc, 1, month, year);
  let y = 48; // ✅ pushed down to clear the taller header

  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(12, y, pageW - 24, 12, 2, 2, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Monthly Expense Report — ${MONTH_NAMES[month - 1]} ${year}`,
    pageW / 2, y + 8, { align: 'center' }
  );
  y += 18;

  // Section 1
  y = addSectionTitle(doc, '1.  Financial Summary', y);

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Status']],
    body: [
      ['Total Spent',
        `Rs. ${totalSpent.toLocaleString('en-IN')}`,
        exceeded ? 'Over Budget' : 'Within Budget'],
      ['Monthly Budget',
        `Rs. ${budget.toLocaleString('en-IN')}`, '—'],
      ['Remaining',
        `Rs. ${Math.abs(remaining).toLocaleString('en-IN')}`,
        remaining < 0 ? 'Deficit' : 'Available'],
      ['Budget Utilisation', `${usedPct}%`,
        parseFloat(usedPct) >= 100 ? 'Exceeded'
          : parseFloat(usedPct) >= 80 ? 'Warning' : 'Good'],
      ['Total Transactions', `${expenses.length}`, '—'],
      ['Average Transaction',
        expenses.length > 0
          ? `Rs. ${(totalSpent / expenses.length).toFixed(0)}`
          : 'Rs. 0', '—'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: ACCENT, textColor: WHITE,
      fontStyle: 'bold', fontSize: 10,
      halign: 'center', cellPadding: 4
    },
    bodyStyles: {
      fontSize: 9, textColor: DARK, cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65 },
      1: { halign: 'center', cellWidth: 60 },
      2: { halign: 'center', cellWidth: 55 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const v = data.cell.raw;
        if (['Over Budget','Exceeded','Deficit'].includes(v)) {
          data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle = 'bold';
        } else if (['Within Budget','Good','Available'].includes(v)) {
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fontStyle = 'bold';
        } else if (v === 'Warning') {
          data.cell.styles.textColor = AMBER;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 12, right: 12 }
  });

  y = doc.lastAutoTable.finalY + 10;

  // Section 2
  y = addSectionTitle(doc, '2.  Category Breakdown', y);

  const categoryRows = categoryEntries.map(([cat, amt]) => [
    cat,
    `Rs. ${amt.toLocaleString('en-IN')}`,
    `${((amt / totalSpent) * 100).toFixed(1)}%`,
    amt > totalSpent * 0.5 ? 'High'
      : amt > totalSpent * 0.25 ? 'Medium' : 'Low'
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount', '% of Total', 'Level']],
    body: categoryRows.length > 0
      ? categoryRows : [['No data', '—', '—', '—']],
    theme: 'striped',
    headStyles: {
      fillColor: ACCENT, textColor: WHITE,
      fontStyle: 'bold', fontSize: 10,
      halign: 'center', cellPadding: 4
    },
    bodyStyles: {
      fontSize: 9, textColor: DARK, cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65 },
      1: { halign: 'center', cellWidth: 55 },
      2: { halign: 'center', cellWidth: 40 },
      3: { halign: 'center', cellWidth: 30 }
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const v = data.cell.raw;
        if (v === 'High') {
          data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle = 'bold';
        } else if (v === 'Medium') {
          data.cell.styles.textColor = AMBER;
          data.cell.styles.fontStyle = 'bold';
        } else if (v === 'Low') {
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 12, right: 12 }
  });

  addFooter(doc);

  // ── PAGE 2 ──────────────────────────────────────
  doc.addPage();
  addHeader(doc, 2, month, year);
  y = 48; // ✅ pushed down to clear the taller header

  // Section 3
  y = addSectionTitle(doc, '3.  All Transactions', y);

  const expenseRows = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((exp, i) => [
      i + 1,
      exp.title,
      exp.category,
      exp.date,
      `Rs. ${exp.amount?.toLocaleString('en-IN')}`,
      exp.description || '—'
    ]);

  autoTable(doc, {
    startY: y,
    head: [['#','Title','Category','Date','Amount','Note']],
    body: expenseRows.length > 0
      ? expenseRows : [['—','No expenses','—','—','—','—']],
    theme: 'grid',
    headStyles: {
      fillColor: ACCENT, textColor: WHITE,
      fontStyle: 'bold', fontSize: 9,
      halign: 'center', cellPadding: 3
    },
    bodyStyles: {
      fontSize: 8, textColor: DARK, cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'center',
           textColor: ACCENT, fontStyle: 'bold' },
      5: { cellWidth: 45 }
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 12, right: 12 }
  });

  y = doc.lastAutoTable.finalY + 10;

  // Section 4
  if (y + 60 < doc.internal.pageSize.getHeight() - 20) {
    y = addSectionTitle(doc, '4.  Analysis & Insights', y);

    const topCat = categoryEntries.length > 0
      ? categoryEntries[0] : null;

    const insights = [
      `${expenses.length} transactions recorded in ${MONTH_NAMES[month - 1]} ${year}.`,
      topCat
        ? `Highest: ${topCat[0]} at Rs. ${topCat[1].toLocaleString('en-IN')} (${((topCat[1] / totalSpent) * 100).toFixed(1)}%).`
        : 'No category data.',
      exceeded
        ? `Budget exceeded by Rs. ${Math.abs(remaining).toLocaleString('en-IN')}.`
        : `Rs. ${remaining.toLocaleString('en-IN')} remaining this month.`,
      expenses.length > 0
        ? `Average transaction: Rs. ${(totalSpent / expenses.length).toFixed(0)}.`
        : 'No transactions.',
      `${categoryEntries.length} spending categories active.`
    ];

    insights.forEach((insight, i) => {
      doc.setFillColor(
        i % 2 === 0 ? 238 : 245,
        i % 2 === 0 ? 242 : 246,
        i % 2 === 0 ? 255 : 250
      );
      doc.roundedRect(12, y, pageW - 24, 10, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      doc.text(`•  ${insight}`, 17, y + 6.5);
      y += 13;
    });
  }

  addFooter(doc);

  doc.save(
    `FinSight_Report_${MONTH_NAMES[month - 1]}_${year}.pdf`
  );
};