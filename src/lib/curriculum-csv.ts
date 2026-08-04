// Flat row shape used for both CSV and the tabular parts of JSON export.
// One row per learning objective; unit/topic/subtopic fields repeat across
// rows that share them — this is what makes it editable in a spreadsheet.
export type CurriculumRow = {
  unitNumber: number;
  unitTitle: string;
  topicNumber: number;
  topicTitle: string;
  subtopicTitle: string;
  objectiveText: string;
  qcaaReference: string;
};

const HEADERS = [
  "unit_number",
  "unit_title",
  "topic_number",
  "topic_title",
  "subtopic_title",
  "objective_text",
  "qcaa_reference",
] as const;

function csvEscape(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rowsToCsv(rows: CurriculumRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.unitNumber,
        csvEscape(r.unitTitle),
        r.topicNumber,
        csvEscape(r.topicTitle),
        csvEscape(r.subtopicTitle),
        csvEscape(r.objectiveText),
        csvEscape(r.qcaaReference),
      ].join(","),
    );
  }
  return lines.join("\n");
}

// Minimal RFC4180-ish CSV parser: handles quoted fields with embedded
// commas/newlines/escaped quotes. Not a general-purpose CSV library —
// deliberately scoped to what this app's export format produces.
function parseCsvLines(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

export function csvToRows(text: string): CurriculumRow[] {
  const lines = parseCsvLines(text.trim());
  const [header, ...body] = lines;
  const index = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

  return body.map((cols) => ({
    unitNumber: Number(cols[index["unit_number"]]),
    unitTitle: cols[index["unit_title"]] ?? "",
    topicNumber: Number(cols[index["topic_number"]]),
    topicTitle: cols[index["topic_title"]] ?? "",
    subtopicTitle: cols[index["subtopic_title"]] ?? "",
    objectiveText: cols[index["objective_text"]] ?? "",
    qcaaReference: cols[index["qcaa_reference"]] ?? "",
  }));
}
