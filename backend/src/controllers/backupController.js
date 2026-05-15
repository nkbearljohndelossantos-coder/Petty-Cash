const ExcelJS = require('exceljs');
const db = require('../config/db');
const path = require('path');
const fs = require('fs');

exports.exportBackup = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NKB Petty Cash System';
    workbook.created = new Date();

    const tables = [
      'departments',
      'categories',
      'funds',
      'users',
      'expenses',
      'expense_attachments',
      'activity_logs',
      'settings'
    ];

    for (const tableName of tables) {
      const data = await db(tableName).select('*');
      const sheet = workbook.addWorksheet(tableName);

      if (data.length > 0) {
        // Add headers
        const columns = Object.keys(data[0]);
        sheet.columns = columns.map(col => ({ header: col, key: col, width: 20 }));

        // Add rows
        sheet.addRows(data);
      } else {
        // If no data, just add a dummy header to define columns if we know them
        // For simplicity, we'll just leave it empty if no data
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `NKB_Backup_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    res.status(200).send(buffer);
  } catch (err) {
    console.error('Export Error:', err);
    res.status(500).json({ success: false, message: 'Export failed: ' + err.message });
  }
};

exports.restoreBackup = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an Excel file' });
  }

  const trx = await db.transaction();

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);

    // Order of restoration to satisfy foreign keys
    const tables = [
      'departments',
      'categories',
      'funds',
      'users',
      'expenses',
      'expense_attachments',
      'activity_logs',
      'settings'
    ];

    // 1. Clear existing data
    // We do this in reverse order of dependencies
    const reverseTables = [...tables].reverse();
    for (const table of reverseTables) {
      await trx(table).del();
    }

    // 2. Insert data from sheets
    for (const tableName of tables) {
      const sheet = workbook.getWorksheet(tableName);
      if (!sheet) continue;

      const rows = [];
      const headers = [];
      
      sheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
      });

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            // Handle dates and special types if necessary
            rowData[header] = cell.value;
          }
        });
        rows.push(rowData);
      });

      if (rows.length > 0) {
        await trx(tableName).insert(rows);
      }
    }

    await trx.commit();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ success: true, message: 'Database restored successfully' });
  } catch (err) {
    await trx.rollback();
    console.error('Restore Error:', err);
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ success: false, message: 'Restore failed: ' + err.message });
  }
};
