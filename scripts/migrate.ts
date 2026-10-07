import { config } from 'dotenv';
import { migrate } from '../lib/db';
config({ path: '.env.local', quiet: true });
migrate().then(() => console.log('Schema atualizado.')).catch(error => { console.error(error); process.exitCode = 1; });
