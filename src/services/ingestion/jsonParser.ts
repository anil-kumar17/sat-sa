/**
 * Pure function JSON Parser for SAT-SA CSE Submissions.
 * Supports array `[...]` and object wrapper `{"records": [...]}` formats.
 * Captures structural syntax and schema errors gracefully without throwing unhandled exceptions.
 */

export interface ParsedJsonResult {
  records: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  error?: string;
}

export function parseJsonText(jsonText: string): ParsedJsonResult {
  if (!jsonText || !jsonText.trim()) {
    return { records: [], error: 'Input JSON text is empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Syntax error parsing JSON.';
    return { records: [], error: `Malformed JSON structure: ${message}` };
  }

  if (Array.isArray(parsed)) {
    const validObjects: Record<string, unknown>[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        validObjects.push(item as Record<string, unknown>);
      } else {
        return {
          records: [],
          error: `Item at index ${i} is not a valid JSON object.`
        };
      }
    }
    return { records: validObjects };
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.records)) {
      const validObjects: Record<string, unknown>[] = [];
      for (let i = 0; i < obj.records.length; i++) {
        const item = obj.records[i];
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          validObjects.push(item as Record<string, unknown>);
        } else {
          return {
            records: [],
            error: `Record at index ${i} in 'records' array is not a valid JSON object.`
          };
        }
      }
      const { records, ...rest } = obj;
      return { records: validObjects, metadata: rest };
    }

    return {
      records: [],
      error: 'JSON object must contain a top-level array or an object with a "records" array.'
    };
  }

  return {
    records: [],
    error: 'JSON must evaluate to an array of record objects or an object with a "records" key.'
  };
}
