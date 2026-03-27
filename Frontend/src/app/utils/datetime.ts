export const BOGOTA_TIME_ZONE = 'America/Bogota';
const DEFAULT_LOCALE = 'es-CO';

type DateInput = Date | string | number | null | undefined;

function hasExplicitTimezone(value: string): boolean {
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
}

function parseDate(input: DateInput): Date | null {
  if (input === null || input === undefined) return null;

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === 'string') {
    const raw = input.trim();
    if (!raw) return null;

    // Backend often sends naive timestamps (without timezone). We treat them as UTC.
    const normalized = hasExplicitTimezone(raw)
      ? raw
      : raw.replace(' ', 'T') + 'Z';

    const parsedFromString = new Date(normalized);
    return Number.isNaN(parsedFromString.getTime()) ? null : parsedFromString;
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBogotaDateTime(input: DateInput, locale = DEFAULT_LOCALE): string {
  const date = parseDate(input);
  if (!date) return '-';

  return new Intl.DateTimeFormat(locale, {
    timeZone: BOGOTA_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatBogotaDate(input: DateInput, locale = DEFAULT_LOCALE): string {
  const date = parseDate(input);
  if (!date) return '-';

  return new Intl.DateTimeFormat(locale, {
    timeZone: BOGOTA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
