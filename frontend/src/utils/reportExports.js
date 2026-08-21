/**
 * Export utility functions for generating CSV and PDF reports
 */

import { formatCurrency } from "./currency";

/**
 * Exports the main report data to CSV format
 */
export const exportToCSV = (
  reportData,
  dailyBreakdown,
  dateRange,
  currencySymbol = "Rs.",
  currencyPosition = "before",
) => {
  const headers = [
    "Date",
    "Total Sales",
    "Invoices",
    "VAT",
    "Gross Profit",
    "Expenses",
    "Net Profit",
  ];

  let csvContent = headers.join(",") + "\n";

  if (dailyBreakdown && dailyBreakdown.length > 0) {
    // Export daily breakdown
    dailyBreakdown.forEach((day) => {
      csvContent += [
        day.date,
        day.totalSales.toFixed(2),
        day.invoiceCount,
        day.totalVAT.toFixed(2),
        day.grossProfit.toFixed(2),
        day.totalExpenses.toFixed(2),
        day.netProfit.toFixed(2),
      ].join(",");
      csvContent += "\n";
    });
  } else {
    // Export summary
    csvContent += [
      dateRange,
      reportData.totalSales.toFixed(2),
      reportData.invoiceCount,
      reportData.totalVAT.toFixed(2),
      reportData.grossProfit.toFixed(2),
      reportData.totalExpenses.toFixed(2),
      reportData.netProfit.toFixed(2),
    ].join(",");
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `financial_report_${dateRange}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports the main report data to PDF format
 */
export const exportToPDF = (
  reportData,
  dailyBreakdown,
  dateRange,
  currencySymbol = "Rs.",
  currencyPosition = "before",
) => {
  const hasBreakdown = dailyBreakdown && dailyBreakdown.length > 0;

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Financial Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #1B5E20;
          border-bottom: 3px solid #1B5E20;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .summary-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          background: #f9fafb;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #6b7280;
          font-weight: normal;
        }
        .summary-card p {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          border-bottom: 2px solid #e5e7eb;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
          background: #f9fafb;
        }
        .text-right {
          text-align: right;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>Financial Report - ${dateRange}</h1>
      
      <div class="summary">
        <div class="summary-card">
          <h3>Total Sales</h3>
          <p>${formatCurrency(reportData.totalSales, currencySymbol, currencyPosition)}</p>
        </div>
        <div class="summary-card">
          <h3>No. of Invoices</h3>
          <p>${reportData.invoiceCount}</p>
        </div>
        <div class="summary-card">
          <h3>VAT Collected</h3>
          <p>${formatCurrency(reportData.totalVAT, currencySymbol, currencyPosition)}</p>
        </div>
        <div class="summary-card">
          <h3>Gross Profit</h3>
          <p class="positive">${formatCurrency(reportData.grossProfit, currencySymbol, currencyPosition)}</p>
        </div>
        <div class="summary-card">
          <h3>Total Expenses</h3>
          <p class="negative">${formatCurrency(reportData.totalExpenses, currencySymbol, currencyPosition)}</p>
        </div>
        <div class="summary-card">
          <h3>Net Profit</h3>
          <p class="${reportData.netProfit >= 0 ? "positive" : "negative"}">
            ${formatCurrency(reportData.netProfit, currencySymbol, currencyPosition)}
          </p>
        </div>
      </div>
  `;

  if (hasBreakdown) {
    htmlContent += `
      <h2 style="margin-top: 30px; color: #1f2937;">Daily Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th class="text-right">Sales</th>
            <th class="text-right">Invoices</th>
            <th class="text-right">VAT</th>
            <th class="text-right">Gross Profit</th>
            <th class="text-right">Expenses</th>
            <th class="text-right">Net Profit</th>
          </tr>
        </thead>
        <tbody>
    `;

    dailyBreakdown.forEach((day) => {
      htmlContent += `
        <tr>
          <td>${day.date}</td>
          <td class="text-right">LKR ${day.totalSales.toFixed(2)}</td>
          <td class="text-right">${day.invoiceCount}</td>
          <td class="text-right">LKR ${day.totalVAT.toFixed(2)}</td>
          <td class="text-right positive">LKR ${day.grossProfit.toFixed(2)}</td>
          <td class="text-right negative">LKR ${day.totalExpenses.toFixed(2)}</td>
          <td class="text-right ${day.netProfit >= 0 ? "positive" : "negative"}">
            LKR ${day.netProfit.toFixed(2)}
          </td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;
  }

  htmlContent += `
      <div class="footer">
        Generated on ${new Date().toLocaleString()} | POS System Financial Report
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

/**
 * Exports modal data (sales or expenses details) to CSV format
 */
export const exportModalData = (
  modalType,
  data,
  dateRange,
  currencySymbol = "Rs.",
  currencyPosition = "before",
) => {
  if (modalType === "sales") {
    const headers = [
      "Invoice",
      "Date",
      "Customer",
      "Items",
      "Total",
      "VAT",
      "Profit",
    ];
    let csvContent = headers.join(",") + "\n";

    data.forEach((sale) => {
      const itemsList = sale.items
        ?.map((item) => `${item.itemName}(x${item.quantity})`)
        .join("; ");
      csvContent += [
        sale.invoiceNumber,
        new Date(sale.createdAt).toLocaleDateString(),
        `"${sale.customerName || "Walk-in"}"`,
        `"${itemsList}"`,
        sale.totalAmount.toFixed(2),
        sale.vatAmount.toFixed(2),
        sale.profit.toFixed(2),
      ].join(",");
      csvContent += "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_details_${dateRange}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (modalType === "expenses") {
    const headers = ["Date", "Category", "Description", "Created By", "Amount"];
    let csvContent = headers.join(",") + "\n";

    data.forEach((expense) => {
      csvContent += [
        new Date(expense.date).toLocaleDateString(),
        expense.category,
        `"${expense.description}"`,
        expense.createdBy?.username || "N/A",
        expense.amount.toFixed(2),
      ].join(",");
      csvContent += "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses_details_${dateRange}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (modalType === "profit") {
    const headers = ["Metric", "Amount"];
    let csvContent = headers.join(",") + "\n";

    const profitData = {
      "Total Sales": data.totalSales.toFixed(2),
      "Cost of Goods Sold": (data.totalSales - data.grossProfit).toFixed(2),
      "Gross Profit": data.grossProfit.toFixed(2),
      "Operating Expenses": data.totalExpenses.toFixed(2),
      "Net Profit": data.netProfit.toFixed(2),
      "Profit Margin (%)":
        data.totalSales > 0
          ? ((data.netProfit / data.totalSales) * 100).toFixed(2)
          : "0.00",
    };

    Object.entries(profitData).forEach(([key, value]) => {
      csvContent += `"${key}",${value}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `profit_breakdown_${dateRange}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Exports modal data to PDF format
 */
export const exportModalDataAsPDF = (
  modalType,
  data,
  dateRange,
  reportData,
  currencySymbol = "Rs.",
  currencyPosition = "before",
) => {
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${
        modalType === "sales"
          ? "Sales Details"
          : modalType === "expenses"
            ? "Expenses Details"
            : "Profit Breakdown"
      }</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #1B5E20;
          border-bottom: 3px solid #1B5E20;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          border-bottom: 2px solid #e5e7eb;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        tr:hover {
          background: #f9fafb;
        }
        .text-right {
          text-align: right;
        }
        .positive { color: #059669; font-weight: 600; }
        .negative { color: #dc2626; font-weight: 600; }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        .summary-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .summary-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 15px;
          background: white;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          font-size: 12px;
          color: #6b7280;
          font-weight: normal;
        }
        .summary-card p {
          margin: 0;
          font-size: 20px;
          font-weight: bold;
        }
        .calc-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .calc-row.total {
          border-top: 2px solid #9ca3af;
          border-bottom: 2px solid #9ca3af;
          font-weight: bold;
          font-size: 16px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
  `;

  if (modalType === "sales") {
    htmlContent += `
      <h1>Sales Details - ${dateRange}</h1>
      <p style="color: #6b7280; margin-bottom: 20px;">Total Records: ${data.length}</p>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Items</th>
            <th class="text-right">Total</th>
            <th class="text-right">VAT</th>
            <th class="text-right">Profit</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((sale) => {
      const itemsList = sale.items
        ?.map((item) => `${item.itemName} (x${item.quantity})`)
        .join(", ");
      htmlContent += `
        <tr>
          <td style="color: #1B5E20; font-weight: 600;">${sale.invoiceNumber}</td>
          <td>${new Date(sale.createdAt).toLocaleDateString()}</td>
          <td>${sale.customerName || "Walk-in"}</td>
          <td style="font-size: 11px; color: #6b7280;">${itemsList}</td>
          <td class="text-right">LKR ${sale.totalAmount.toFixed(2)}</td>
          <td class="text-right">LKR ${sale.vatAmount.toFixed(2)}</td>
          <td class="text-right positive">LKR ${sale.profit.toFixed(2)}</td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;
  } else if (modalType === "expenses") {
    htmlContent += `
      <h1>Expenses Details - ${dateRange}</h1>
      <p style="color: #6b7280; margin-bottom: 20px;">Total Records: ${data.length}</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Created By</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((expense) => {
      htmlContent += `
        <tr>
          <td>${new Date(expense.date).toLocaleDateString()}</td>
          <td>
            <span style="background: #f3e8ff; color: #7c3aed; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
              ${expense.category}
            </span>
          </td>
          <td>${expense.description}</td>
          <td style="color: #6b7280;">${expense.createdBy?.username || "N/A"}</td>
          <td class="text-right negative">LKR ${expense.amount.toFixed(2)}</td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;
  } else if (modalType === "profit") {
    const profitMargin =
      reportData.totalSales > 0
        ? ((reportData.netProfit / reportData.totalSales) * 100).toFixed(1)
        : 0;

    htmlContent += `
      <h1>Profit Breakdown - ${dateRange}</h1>
      
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Gross Profit</h3>
          <p class="positive">LKR ${reportData.grossProfit.toFixed(2)}</p>
        </div>
        <div class="summary-card">
          <h3>Total Expenses</h3>
          <p class="negative">LKR ${reportData.totalExpenses.toFixed(2)}</p>
        </div>
        <div class="summary-card">
          <h3>Net Profit</h3>
          <p class="${reportData.netProfit >= 0 ? "positive" : "negative"}">
            LKR ${reportData.netProfit.toFixed(2)}
          </p>
        </div>
      </div>

      <div class="summary-box">
        <h2 style="margin-top: 0; color: #1f2937;">Calculation</h2>
        <div class="calc-row">
          <span style="color: #6b7280;">Total Sales</span>
          <span style="font-weight: 600;">LKR ${reportData.totalSales.toFixed(2)}</span>
        </div>
        <div class="calc-row">
          <span style="color: #6b7280;">Cost of Goods Sold (COGS)</span>
          <span class="negative">- LKR ${(
            reportData.totalSales - reportData.grossProfit
          ).toFixed(2)}</span>
        </div>
        <div class="calc-row" style="font-weight: 600;">
          <span style="color: #374151;">Gross Profit</span>
          <span class="positive">LKR ${reportData.grossProfit.toFixed(2)}</span>
        </div>
        <div class="calc-row">
          <span style="color: #6b7280;">Operating Expenses</span>
          <span class="negative">- LKR ${reportData.totalExpenses.toFixed(2)}</span>
        </div>
        <div class="calc-row total">
          <span class="${reportData.netProfit >= 0 ? "positive" : "negative"}">Net Profit</span>
          <span class="${reportData.netProfit >= 0 ? "positive" : "negative"}">
            LKR ${reportData.netProfit.toFixed(2)}
          </span>
        </div>
      </div>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-top: 20px;">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Profit Margin</p>
        <p style="margin: 0; font-size: 32px; font-weight: bold;" class="${
          reportData.netProfit >= 0 ? "positive" : "negative"
        }">
          ${profitMargin}%
        </p>
      </div>
    `;
  }

  htmlContent += `
      <div class="footer">
        Generated on ${new Date().toLocaleString()} | POS System Detailed Report
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
