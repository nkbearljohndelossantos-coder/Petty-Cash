
export const exportExpensesToPDF = async (expenses, filters) => {
  // Dynamic imports to save bundle size
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');
  const { format } = await import('date-fns');

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // Navy
  doc.text('NKB MANUFACTURING', 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text('Petty Cash Expense Report', 14, 30);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 14, 38);
  
  // Line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 42, 196, 42);
  
  // Table Data
  const tableColumn = ["Date", "Category", "Requested By", "Department", "Remarks", "Amount", "Status"];
  const tableRows = expenses.map(exp => [
    format(new Date(exp.date), 'MMM dd, yyyy'),
    exp.category_name,
    exp.requested_by,
    exp.department_name,
    exp.remarks || '-',
    `PHP ${parseFloat(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    exp.status
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 50,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      5: { halign: 'right', fontStyle: 'bold' }, // Amount
      6: { halign: 'center' } // Status
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // Footer
  const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL EXPENSES: PHP ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 196, finalY, { align: 'right' });
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text('This is a computer-generated report.', 14, 285);

  doc.save(`NKB_Petty_Cash_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};
