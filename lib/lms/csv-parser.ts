/**
 * Lightweight RFC 4180-ish CSV parser for admin question imports.
 * Handles quoted fields with embedded commas and newlines.
 *
 * `excelRow` matches spreadsheet row numbers: the header is row 1, blank
 * records (empty lines or `,,,,,,`) still increment the count, and a quoted
 * field that contains line breaks stays a single row.
 */

export interface ParsedCsvRow {
  excelRow: number;
  values: Record<string, string>;
}

export interface ParsedCsv {
  headers: string[];
  rows: ParsedCsvRow[];
}

function isPopulatedRecord(cells: string[]): boolean {
  return cells.some((cell) => cell.trim().length > 0);
}

export function parseCsv(text: string): ParsedCsv {
  const records: { excelRow: number; cells: string[] }[] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let excelRow = 0;

  const finishRecord = () => {
    excelRow += 1;
    if (isPopulatedRecord(current)) {
      records.push({ excelRow, cells: current });
    }
    current = [];
    field = "";
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      current.push(field);
      field = "";
      continue;
    }

    if (char === "\n" || (char === "\r" && next === "\n")) {
      current.push(field);
      finishRecord();
      if (char === "\r") i++;
      continue;
    }

    if (char === "\r") {
      current.push(field);
      finishRecord();
      continue;
    }

    field += char;
  }

  if (field.length > 0 || current.length > 0) {
    current.push(field);
    finishRecord();
  }

  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = records[0].cells.map((h) => h.trim());
  const rows = records.slice(1).map((record) => {
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      values[header] = (record.cells[index] ?? "").trim();
    });
    return { excelRow: record.excelRow, values };
  });

  return { headers, rows };
}
