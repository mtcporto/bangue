import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({ testDir: './tests/browser', use: { baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000', launchOptions: { executablePath: existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined, args: ['--no-sandbox'] } }, workers: 1, reporter: 'list' });
