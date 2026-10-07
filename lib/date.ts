import { TIMEZONE } from "./types";
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
export function displayDate(date: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }): string {
  return new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: TIMEZONE }).format(new Date(`${date}T12:00:00-03:00`));
}
export function daysInPeriod(period: string): string[] {
  const [year, month] = period.split("-").map(Number);
  return Array.from({ length: new Date(Date.UTC(year, month, 0)).getUTCDate() }, (_, i) => `${period}-${String(i + 1).padStart(2, "0")}`);
}
