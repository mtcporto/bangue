import seed from '@/data/schedule.json';
import { randomUUID } from 'node:crypto';
import { databaseConfigured, getDb } from './db';
import { today } from './date';
import type { Schedule } from './types';
export type StoredSchedule = { schedule: Schedule; storage: 'turso' | 'snapshot'; degraded: boolean };
export async function readSchedule(period?: string): Promise<StoredSchedule> {
  if (databaseConfigured()) {
    try {
      const result = period
        ? await getDb().execute({ sql: 'SELECT payload FROM schedules WHERE period = ?', args: [period] })
        : await getDb().execute({ sql: `SELECT payload FROM schedules ORDER BY CASE WHEN period = ? THEN 0 ELSE 1 END, period DESC LIMIT 1`, args: [today().slice(0, 7)] });
      if (result.rows[0]) {
        const schedule = JSON.parse(String(result.rows[0].payload)) as Schedule;
        const corrections = await getDb().execute({ sql: 'SELECT session_id, payload FROM corrections WHERE source_hash = ?', args: [schedule.sourceHash] });
        for (const correction of corrections.rows) {
          const session = schedule.sessions.find(s => s.id === correction.session_id);
          if (session) Object.assign(session, JSON.parse(String(correction.payload)));
        }
        const reviews = await getDb().execute({ sql: 'SELECT issue_id, resolution FROM reviews WHERE source_hash = ?', args: [schedule.sourceHash] });
        for (const review of reviews.rows) {
          const issue = schedule.issues.find(i => i.id === review.issue_id);
          if (issue) { issue.resolved = true; issue.resolution = String(review.resolution); }
        }
        for (const session of schedule.sessions) session.needsReview = schedule.issues.some(i => !i.resolved && i.sessionIds.includes(session.id));
        schedule.sessions.sort((a,b) => a.startsAt.localeCompare(b.startsAt));
        return { schedule, storage: 'turso', degraded: false };
      }
    } catch (error) { console.error('schedule_read_failed', error instanceof Error ? error.message : 'unknown'); return snapshot(period, true); }
  }
  return snapshot(period, false);
}
function snapshot(period?: string, degraded = false): StoredSchedule {
  if (period && period !== seed.period) throw new Error('PERIOD_NOT_FOUND');
  return { schedule: structuredClone(seed) as Schedule, storage: 'snapshot', degraded };
}
export async function persistSchedule(schedule: Schedule, html: string, actor: string) {
  if (schedule.sessions.some(s => s.venue !== 'Cine Bangüê')) throw new Error('Cinema diferente do Cine Bangüê.');
  const id = randomUUID();
  const payload = JSON.stringify(schedule);
  await getDb().batch([
    { sql: `INSERT INTO imports (id, period, fetched_at, source_hash, source_html, payload, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 'published', ?)`, args: [id, schedule.period, schedule.fetchedAt, schedule.sourceHash, html, payload, actor] },
    { sql: `INSERT INTO schedules (period, import_id, payload, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(period) DO UPDATE SET import_id=excluded.import_id, payload=excluded.payload, updated_at=excluded.updated_at`, args: [schedule.period, id, payload, schedule.fetchedAt] }
  ], 'write');
  return id;
}
