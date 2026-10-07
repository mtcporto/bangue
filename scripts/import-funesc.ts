import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
async function main() {
  if (process.argv.includes('--snapshot')) {
    const { readFile, writeFile } = await import('node:fs/promises');
    const { parseFunesc } = await import('../lib/parser');
    const schedule = parseFunesc(await readFile('data/sources/funesc-2026-10.html', 'utf8'));
    await writeFile('data/schedule.json', JSON.stringify(schedule, null, 2) + '\n');
    console.log(`${schedule.sessions.length} sessões, ${schedule.films.length} filmes, ${schedule.issues.length} divergências.`);
    return;
  }
  const { migrate } = await import('../lib/db');
  const { importSchedule } = await import('../lib/collector');
  await migrate();
  console.log(await importSchedule('cli'));
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
