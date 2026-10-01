import { BadRequestException } from '@nestjs/common';
import Papa from 'papaparse';

/**
 * The exact header row of the candidate CSV file.
 *
 * `jobId` and `jobTitle` are both written on export so an exported file can
 * be edited and imported again without losing information.
 */
export const CANDIDATE_CSV_COLUMNS = [
  'name',
  'email',
  'phone',
  'jobId',
  'jobTitle',
] as const;

const SUPPORTED_COLUMNS: readonly string[] =
  CANDIDATE_CSV_COLUMNS;

const REQUIRED_COLUMNS: readonly string[] = [
  'name',
  'email',
];

const JOB_COLUMNS: readonly string[] = [
  'jobId',
  'jobTitle',
];

export const MAX_CANDIDATE_CSV_ROWS = 1000;

export const MAX_CANDIDATE_CSV_FILE_SIZE = 5 * 1024 * 1024;

export type CandidateCsvRow = {
  name: string;
  email: string;
  phone: string | null;
  jobId: number | null;
  jobTitle: string | null;
};

export type CandidateCsvParsedRow = {
  /** 1-based row number, counting the header row, as Excel shows it. */
  row: number;
  name: string;
  email: string;
  phone?: string;
  jobId?: number;
  jobTitle?: string;
};

export type CandidateCsvImportError = {
  row: number;
  message: string;
};

/**
 * Turns one value into a safe CSV field.
 *
 * Empty and null values become an empty cell, and any value containing a
 * comma, a quote or a line break is wrapped in quotes so Excel and
 * spreadsheets keep it in one piece.
 */
export function escapeCsvValue(
  value: unknown,
): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  const needsQuotes =
    /[",\r\n]/.test(text) ||
    text !== text.trim();

  if (!needsQuotes) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsvLine(
  values: unknown[],
): string {
  return values.map(escapeCsvValue).join(',');
}

export function serializeCandidateCsv(
  rows: CandidateCsvRow[],
): string {
  const lines = [
    toCsvLine([...CANDIDATE_CSV_COLUMNS]),
    ...rows.map((row) =>
      toCsvLine([
        row.name,
        row.email,
        row.phone,
        row.jobId,
        row.jobTitle,
      ]),
    ),
  ];

  return `${lines.join('\r\n')}\r\n`;
}

function normalizeHeaders(
  rawHeaderRow: string[],
): string[] {
  const headers = rawHeaderRow.map(
    (cell) => (cell ?? '').trim(),
  );

  headers.forEach((header, index) => {
    if (!header) {
      throw new BadRequestException(
        `The header in column ${index + 1} is empty.`,
      );
    }

    if (!SUPPORTED_COLUMNS.includes(header)) {
      throw new BadRequestException(
        `Unknown column "${header}". Supported columns are: ${SUPPORTED_COLUMNS.join(', ')}.`,
      );
    }
  });

  const duplicates = headers.filter(
    (header, index) =>
      headers.indexOf(header) !== index,
  );

  if (duplicates.length > 0) {
    throw new BadRequestException(
      `Duplicate column "${duplicates[0]}" in the header row.`,
    );
  }

  const missing = REQUIRED_COLUMNS.filter(
    (column) => !headers.includes(column),
  );

  if (missing.length > 0) {
    throw new BadRequestException(
      `Missing required column(s): ${missing.join(', ')}.`,
    );
  }

  const hasJobColumn = headers.some(
    (header) => JOB_COLUMNS.includes(header),
  );

  if (!hasJobColumn) {
    throw new BadRequestException(
      `Provide at least one of these columns: ${JOB_COLUMNS.join(', ')}.`,
    );
  }

  return headers;
}

function mapRow(
  headers: string[],
  cells: string[],
  row: number,
): CandidateCsvParsedRow {
  if (cells.length > headers.length) {
    throw new BadRequestException(
      `Row has ${cells.length} values but the header has ${headers.length} columns.`,
    );
  }

  const readColumn = (column: string) => {
    const index = headers.indexOf(column);

    if (index === -1) {
      return '';
    }

    return (cells[index] ?? '').trim();
  };

  const jobIdValue = readColumn('jobId');

  const jobTitleValue = readColumn('jobTitle');

  if (jobIdValue) {
    const jobId = Number(jobIdValue);

    if (!Number.isInteger(jobId) || jobId < 1) {
      throw new BadRequestException(
        `jobId must be a whole number greater than 0 (received "${jobIdValue}").`,
      );
    }

    return {
      row,
      name: readColumn('name'),
      email: readColumn('email'),
      phone: readColumn('phone') || undefined,
      jobId,
      jobTitle: jobTitleValue || undefined,
    };
  }

  if (!jobTitleValue) {
    throw new BadRequestException(
      'Either jobId or jobTitle must be provided.',
    );
  }

  return {
    row,
    name: readColumn('name'),
    email: readColumn('email'),
    phone: readColumn('phone') || undefined,
    jobTitle: jobTitleValue,
  };
}

function isEmptyRow(cells: string[]): boolean {
  return cells.every(
    (cell) => (cell ?? '').trim() === '',
  );
}

/**
 * Reads a candidate CSV file into rows.
 *
 * Throws a BadRequestException when the file is empty, when the header row
 * is missing or invalid, or when a row cannot be read at all. Rows that are
 * completely empty are skipped.
 */
export function parseCandidateCsv(
  content: string,
): { rows: CandidateCsvParsedRow[] } {
  const normalizedContent = content.replace(
    /^\uFEFF/,
    '',
  );

  if (!normalizedContent.trim()) {
    throw new BadRequestException(
      'The CSV file is empty.',
    );
  }

  const parsed = Papa.parse<string[]>(
    normalizedContent,
    {
      // Empty lines are kept here so the row numbers in the error
      // messages match the row numbers shown in the spreadsheet.
      skipEmptyLines: false,
      // HireDesk CSV files are comma separated, like the ones the
      // export endpoint produces.
      delimiter: ',',
    },
  );

  const parseError = parsed.errors[0];

  if (parseError) {
    throw new BadRequestException(
      `The CSV file could not be parsed: ${parseError.message}`,
    );
  }

  const [rawHeaderRow, ...dataRows] =
    parsed.data;

  if (
    !rawHeaderRow ||
    rawHeaderRow.length === 0
  ) {
    throw new BadRequestException(
      'The CSV file does not contain a header row.',
    );
  }

  const headers = normalizeHeaders(rawHeaderRow);

  if (dataRows.length > MAX_CANDIDATE_CSV_ROWS) {
    throw new BadRequestException(
      `The CSV file has more than ${MAX_CANDIDATE_CSV_ROWS} rows. Please split it into smaller files.`,
    );
  }

  const rows: CandidateCsvParsedRow[] = [];

  dataRows.forEach((cells, index) => {
    if (isEmptyRow(cells)) {
      return;
    }

    rows.push(
      mapRow(headers, cells, index + 2),
    );
  });

  return { rows };
}