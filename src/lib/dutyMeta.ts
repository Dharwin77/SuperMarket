const DUTY_META_PREFIX = '[[DUTY_META]]';

export interface ParsedDutyMeta {
  cleanDescription: string;
  module: string;
  dutyStartTime: string;
  dutyEndTime: string;
}

export function parseDutyDescription(raw?: string): ParsedDutyMeta {
  const source = raw || '';
  const lines = source.split('\n');
  const first = (lines[0] || '').trim();

  if (!first.startsWith(DUTY_META_PREFIX)) {
    return {
      cleanDescription: source,
      module: '',
      dutyStartTime: '',
      dutyEndTime: '',
    };
  }

  const payload = first.replace(DUTY_META_PREFIX, '').trim();
  const parts = payload.split(';');
  const meta: Record<string, string> = {};

  parts.forEach((part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      meta[key.trim()] = value.trim();
    }
  });

  return {
    cleanDescription: lines.slice(1).join('\n').trim(),
    module: meta.module || '',
    dutyStartTime: meta.start || '',
    dutyEndTime: meta.end || '',
  };
}

export function normalizeDepartment(value?: string): string {
  if (!value) return '';
  if (value === 'Worker') return 'Workers';
  return value;
}
