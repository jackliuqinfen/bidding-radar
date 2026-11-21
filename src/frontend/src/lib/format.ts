/** Shared formatting helpers for backend values. */

/** Motoko Time.now() is a nanosecond bigint. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(timestamp: bigint | undefined): string {
  if (timestamp === undefined) return "—";
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateTime(timestamp: bigint | undefined): string {
  if (timestamp === undefined) return "—";
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${formatDate(timestamp)} ${hh}:${mm}`;
}

/** Convert a yyyy-mm-dd input value to a UTC-midnight nanosecond timestamp. */
export function dateInputToTimestamp(value: string): bigint | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return BigInt(parsed.getTime()) * 1_000_000n;
}

export function timestampToDateInput(timestamp: bigint | undefined): string {
  if (timestamp === undefined) return "";
  const date = timestampToDate(timestamp);
  if (!date) return "";
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Contract amounts are stored in fen (分). */
export function formatFen(fen: bigint | undefined): string {
  if (fen === undefined) return "—";
  const yuan = Number(fen) / 100;
  return `¥${yuan.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fenFromYuanInput(value: string): bigint | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const yuan = Number(trimmed);
  if (Number.isNaN(yuan) || yuan < 0) return undefined;
  return BigInt(Math.round(yuan * 100));
}

export function yuanInputFromFen(fen: bigint | undefined): string {
  if (fen === undefined) return "";
  return (Number(fen) / 100).toFixed(2);
}

export function formatCount(value: bigint): string {
  return value.toString();
}

/** Mask a Chinese ID number: keep first 3 and last 4 digits. */
export function maskIdNumber(idNumber: string): string {
  if (!idNumber) return "—";
  if (idNumber.length <= 7) return `${idNumber.slice(0, 1)}****`;
  return `${idNumber.slice(0, 3)}********${idNumber.slice(-4)}`;
}
