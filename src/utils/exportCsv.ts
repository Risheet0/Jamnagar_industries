/**
 * Utility functions for exporting tabular and object data to CSV / JSON files in the browser.
 */

export interface CsvColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => any);
}

export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // 1. Headers row
  const headerRow = columns.map(col => escapeCsvValue(col.header)).join(',');

  // 2. Data rows
  const dataRows = data.map(row => {
    return columns
      .map(col => {
        let val: any;
        if (typeof col.accessor === 'function') {
          val = col.accessor(row);
        } else {
          val = row[col.accessor];
        }
        return escapeCsvValue(val);
      })
      .join(',');
  });

  const csvContent = [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }
  let str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  } else {
    str = `"${str}"`;
  }
  return str;
}

export function downloadJsonFile(data: any, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
