import { Student } from '../types';

/**
 * Sample roster for instant classroom demonstration
 */
export const SAMPLE_STUDENTS: Student[] = [
  { id: 'sample-1', seatNumber: 1, name: '陳冠宇' },
  { id: 'sample-2', seatNumber: 2, name: '林庭宇' },
  { id: 'sample-3', seatNumber: 3, name: '張家瑋' },
  { id: 'sample-4', seatNumber: 4, name: '黃柏翰' },
  { id: 'sample-5', seatNumber: 5, name: '王品涵' },
  { id: 'sample-6', seatNumber: 6, name: '吳承恩' },
  { id: 'sample-7', seatNumber: 7, name: '劉子軒' },
  { id: 'sample-8', seatNumber: 8, name: '蔡宜庭' },
  { id: 'sample-9', seatNumber: 9, name: '楊宗翰' },
  { id: 'sample-10', seatNumber: 10, name: '許庭瑋' },
  { id: 'sample-11', seatNumber: 11, name: '鄭宇捷' },
  { id: 'sample-12', seatNumber: 12, name: '謝沛珊' },
  { id: 'sample-13', seatNumber: 13, name: '洪子豪' },
  { id: 'sample-14', seatNumber: 14, name: '郭芸甄' },
  { id: 'sample-15', seatNumber: 15, name: '邱建宏' },
  { id: 'sample-16', seatNumber: 16, name: '曾雅婷' },
  { id: 'sample-17', seatNumber: 17, name: '廖柏翔' },
  { id: 'sample-18', seatNumber: 18, name: '賴宣羽' },
  { id: 'sample-19', seatNumber: 19, name: '徐晨皓' },
  { id: 'sample-20', seatNumber: 20, name: '周思妤' },
  { id: 'sample-21', seatNumber: 21, name: '葉子揚' },
  { id: 'sample-22', seatNumber: 22, name: '蘇靖雯' },
  { id: 'sample-23', seatNumber: 23, name: '潘威廷' },
  { id: 'sample-24', seatNumber: 24, name: '魏宇彤' },
  { id: 'sample-25', seatNumber: 25, name: '何睿恩' },
  { id: 'sample-26', seatNumber: 26, name: '施采葳' },
  { id: 'sample-27', seatNumber: 27, name: '馮冠霖' },
  { id: 'sample-28', seatNumber: 28, name: '鐘品妤' },
];

/**
 * Parse raw text pasted by the teacher (comma, space, or newline separated)
 */
export function parsePastedText(text: string): Student[] {
  if (!text || !text.trim()) return [];

  // Clean BOM and carriage returns
  const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  const students: Student[] = [];

  // Check if it's CSV-like (contains commas or tabs)
  if (lines.some(l => l.includes(',') || l.includes('\t'))) {
    return parseCsvContent(cleanText);
  }

  // Plain names list (one per line, or spaces/commas)
  let seatCounter = 1;
  for (const line of lines) {
    // If line has multiple names separated by commas or spaces
    const tokens = line.split(/[,，\s]+/).filter(Boolean);
    for (const token of tokens) {
      const name = token.trim();
      // If token is just a number, skip or track as seat number
      if (/^\d+$/.test(name)) continue;

      // Extract optional leading seat number like "1. 王小明" or "01-陳冠宇"
      const match = name.match(/^(\d+)[\.、\-_：:\s]*(.+)$/);
      if (match) {
        students.push({
          id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          seatNumber: parseInt(match[1], 10),
          name: match[2].trim(),
        });
      } else {
        students.push({
          id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          seatNumber: seatCounter++,
          name: name,
        });
      }
    }
  }

  return students;
}

/**
 * Parse CSV text from file or clipboard
 */
export function parseCsvContent(content: string): Student[] {
  const clean = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = clean.split('\n').filter(l => l.trim().length > 0);

  if (rawLines.length === 0) return [];

  // Simple CSV row tokenizer supporting quotes
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    // determine delimiter: tab or comma
    const delimiter = line.includes('\t') && !line.includes(',') ? '\t' : ',';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const rows = rawLines.map(parseRow);
  if (rows.length === 0) return [];

  // Check header row for common column identifiers
  const header = rows[0].map(h => h.toLowerCase().trim());
  let nameColIdx = -1;
  let seatColIdx = -1;
  let noteColIdx = -1;

  header.forEach((col, idx) => {
    if (/姓名|name|學生|名字|全名|student/i.test(col)) {
      nameColIdx = idx;
    } else if (/座號|seat|號碼|編號|no|序號/i.test(col)) {
      seatColIdx = idx;
    } else if (/備註|note|組別|性別/i.test(col)) {
      noteColIdx = idx;
    }
  });

  const hasHeader = nameColIdx !== -1 || seatColIdx !== -1;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  // If no header found, guess:
  // If 2 columns: column with numbers is seat, other is name
  if (nameColIdx === -1) {
    if (dataRows.length > 0 && dataRows[0].length >= 2) {
      if (/^\d+$/.test(dataRows[0][0])) {
        seatColIdx = 0;
        nameColIdx = 1;
      } else if (/^\d+$/.test(dataRows[0][1])) {
        nameColIdx = 0;
        seatColIdx = 1;
      } else {
        nameColIdx = 0;
      }
    } else {
      nameColIdx = 0;
    }
  }

  const students: Student[] = [];
  let autoSeat = 1;

  dataRows.forEach((row) => {
    const rawName = row[nameColIdx]?.trim() || '';
    if (!rawName) return;

    // Filter out common repeated header words if accidentally included
    if (/^(姓名|name|學生姓名|座號)$/i.test(rawName)) return;

    let seat: number | string = autoSeat++;
    if (seatColIdx !== -1 && row[seatColIdx]) {
      const parsedSeat = parseInt(row[seatColIdx].trim(), 10);
      if (!isNaN(parsedSeat)) {
        seat = parsedSeat;
      } else {
        seat = row[seatColIdx].trim();
      }
    }

    students.push({
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      seatNumber: seat,
      name: rawName,
      note: noteColIdx !== -1 ? row[noteColIdx]?.trim() : undefined,
    });
  });

  return students;
}
