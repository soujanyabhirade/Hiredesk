import { BadRequestException } from '@nestjs/common';

import {
  CANDIDATE_CSV_COLUMNS,
  escapeCsvValue,
  parseCandidateCsv,
  serializeCandidateCsv,
  toCsvLine,
} from './candidates-csv.util.js';

describe('candidates csv util', () => {
  describe('escapeCsvValue', () => {
    it('should return an empty cell for null and undefined', () => {
      expect(escapeCsvValue(null)).toBe('');
      expect(escapeCsvValue(undefined)).toBe('');
    });

    it('should keep simple values unchanged', () => {
      expect(escapeCsvValue('Ada')).toBe('Ada');
      expect(escapeCsvValue(12)).toBe('12');
      expect(escapeCsvValue(0)).toBe('0');
    });

    it('should wrap values containing a comma', () => {
      expect(
        escapeCsvValue('Lovelace, Ada'),
      ).toBe('"Lovelace, Ada"');
    });

    it('should double quotes inside a quoted value', () => {
      expect(
        escapeCsvValue('She said "hi"'),
      ).toBe('"She said ""hi"""');
    });

    it('should wrap values containing a line break', () => {
      expect(
        escapeCsvValue('line1\nline2'),
      ).toBe('"line1\nline2"');
    });

    it('should wrap values with leading or trailing spaces', () => {
      expect(escapeCsvValue(' Ada ')).toBe(
        '" Ada "',
      );
    });
  });

  describe('toCsvLine', () => {
    it('should join values with commas', () => {
      expect(
        toCsvLine(['a', 'b', null]),
      ).toBe('a,b,');
    });
  });

  describe('serializeCandidateCsv', () => {
    it('should write a header row and a data row', () => {
      const csv = serializeCandidateCsv([
        {
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          phone: null,
          jobId: 1,
          jobTitle: 'Backend Developer',
        },
      ]);

      expect(csv).toBe(
        'name,email,phone,jobId,jobTitle\r\n' +
          'Ada Lovelace,ada@example.com,,1,Backend Developer\r\n',
      );
    });

    it('should write only the header row when there are no rows', () => {
      expect(serializeCandidateCsv([])).toBe(
        `${CANDIDATE_CSV_COLUMNS.join(',')}\r\n`,
      );
    });

    it('should escape commas and quotes in values', () => {
      const csv = serializeCandidateCsv([
        {
          name: 'Lovelace, Ada "Countess"',
          email: 'ada@example.com',
          phone: '999',
          jobId: 2,
          jobTitle: 'Analyst, Data',
        },
      ]);

      expect(csv).toContain(
        '"Lovelace, Ada ""Countess""",ada@example.com,999,2,"Analyst, Data"',
      );
    });
  });

  describe('parseCandidateCsv', () => {
    it('should reject an empty file', () => {
      expect(() => parseCandidateCsv('')).toThrow(
        BadRequestException,
      );

      expect(() =>
        parseCandidateCsv('   \n  '),
      ).toThrow('The CSV file is empty.');
    });

    it('should reject a missing header row', () => {
      expect(() =>
        parseCandidateCsv('"'),
      ).toThrow(BadRequestException);
    });

    it('should reject a missing required column', () => {
      expect(() =>
        parseCandidateCsv('name,jobId\nAda,1\n'),
      ).toThrow(
        'Missing required column(s): email.',
      );
    });

    it('should reject an unknown column', () => {
      expect(() =>
        parseCandidateCsv(
          'name,email,jobId,salary\nAda,ada@example.com,1,100\n',
        ),
      ).toThrow('Unknown column "salary".');
    });

    it('should reject an empty header cell', () => {
      expect(() =>
        parseCandidateCsv(
          'name,email,,jobId\nAda,ada@example.com,,1\n',
        ),
      ).toThrow(
        'The header in column 3 is empty.',
      );
    });

    it('should reject a duplicated column', () => {
      expect(() =>
        parseCandidateCsv(
          'name,email,email,jobId\nAda,ada@example.com,ada@example.com,1\n',
        ),
      ).toThrow('Duplicate column "email"');
    });

    it('should reject a file without a job column', () => {
      expect(() =>
        parseCandidateCsv(
          'name,email\nAda,ada@example.com\n',
        ),
      ).toThrow(
        'Provide at least one of these columns: jobId, jobTitle.',
      );
    });

    it('should reject a non numeric jobId', () => {
      expect(() =>
        parseCandidateCsv(
          'name,email,jobId\nAda,ada@example.com,first\n',
        ),
      ).toThrow(
        'jobId must be a whole number greater than 0 (received "first").',
      );
    });

    it('should reject a row without a job', () => {
      expect(() =>
        parseCandidateCsv(
          'name,email,jobId\nAda,ada@example.com,\n',
        ),
      ).toThrow(
        'Either jobId or jobTitle must be provided.',
      );
    });

    it('should reject a row with more values than columns', () => {
      expect(() =>
        parseCandidateCsv(
          'name,email,jobId\nAda,ada@example.com,1,extra\n',
        ),
      ).toThrow(
        'Row has 4 values but the header has 3 columns.',
      );
    });

    it('should reject a file with too many rows', () => {
      const rows = Array.from(
        { length: 1001 },
        (_, index) =>
          `Person ${index},person${index}@example.com,1`,
      );

      expect(() =>
        parseCandidateCsv(
          `name,email,jobId\r\n${rows.join('\r\n')}\r\n`,
        ),
      ).toThrow(
        'The CSV file has more than 1000 rows.',
      );
    });

    it('should ignore a byte order mark', () => {
      const { rows } = parseCandidateCsv(
        '\uFEFFname,email,jobId\r\nAda,ada@example.com,1\r\n',
      );

      expect(rows).toEqual([
        {
          row: 2,
          name: 'Ada',
          email: 'ada@example.com',
          jobId: 1,
        },
      ]);
    });

    it('should skip empty rows', () => {
      const { rows } = parseCandidateCsv(
        [
          'name,email,jobId',
          'Ada,ada@example.com,1',
          ',,',
          '',
          'Grace,grace@example.com,2',
        ].join('\n'),
      );

      expect(rows).toHaveLength(2);
      expect(rows[0].row).toBe(2);
      expect(rows[1].row).toBe(5);
    });

    it('should read values that contain commas and quotes', () => {
      const { rows } = parseCandidateCsv(
        [
          'name,email,phone,jobId,jobTitle',
          '"Lovelace, Ada","ada@example.com","999,111",1,"Backend, Developer"',
        ].join('\n'),
      );

      expect(rows).toEqual([
        {
          row: 2,
          name: 'Lovelace, Ada',
          email: 'ada@example.com',
          phone: '999,111',
          jobId: 1,
          jobTitle: 'Backend, Developer',
        },
      ]);
    });

    it('should accept a jobTitle without a jobId', () => {
      const { rows } = parseCandidateCsv(
        'name,email,jobTitle\nAda,ada@example.com,Backend Developer\n',
      );

      expect(rows).toEqual([
        {
          row: 2,
          name: 'Ada',
          email: 'ada@example.com',
          jobTitle: 'Backend Developer',
        },
      ]);
    });
  });
});