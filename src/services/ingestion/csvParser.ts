/**
 * Pure function CSV Parser for SAT-SA CSE Submissions.
 * Handles quoted cells with embedded commas and escaped quotes (""),
 * CRLF and LF line endings, empty optional fields, and UTF-8 BOM.
 */

export interface ParsedCsvResult {
  headers: string[];
  records: Record<string, string>[];
  errors?: string[];
}

export function parseCsvText(csvText: string): ParsedCsvResult {
  if (!csvText || !csvText.trim()) {
    return { headers: [], records: [] };
  }

  // Strip Byte Order Mark (BOM) if present
  let cleanText = csvText.replace(/^[\uFEFF]/, '');

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote inside quotes ("") -> append a single quote
          currentCell += '"';
          i++; // skip second quote
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // skip \n in CRLF
        }
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentCell += char;
      }
    }
  }

  // Push trailing cell and row if any
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], records: [] };
  }

  // Extract raw headers and normalize header keys (lowercase, trim, strip surrounding quotes)
  const rawHeaders = rows[0].map(h => h.trim().replace(/^["']|["']$/g, ''));
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowObj: Record<string, string> = {};
    rawHeaders.forEach((header, index) => {
      rowObj[header] = row[index] !== undefined ? row[index].trim() : '';
    });
    records.push(rowObj);
  }

  return {
    headers: rawHeaders,
    records
  };
}
