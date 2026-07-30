/**
 * Test ZeptoMail Direct HTTP REST API Dispatch Script
 *
 * Usage from `apps/server`:
 *   npx tsx --env-file=.env src/scripts/test-zeptomail.ts <RECIPIENT_EMAIL>
 */

import Fastify from 'fastify';
import envPlugin, { getConfig } from '../config/env.js';
import { sendMail } from '../lib/zeptomail.js';

async function main() {
  const app = Fastify();
  await app.register(envPlugin);

  const recipientEmail = process.argv[2];
  if (!recipientEmail) {
    console.error('Please provide a recipient email address.');
    console.error('Usage: npx tsx --env-file=.env src/scripts/test-zeptomail.ts recipient@example.com');
    process.exit(1);
  }

  const config = getConfig();

  console.log('--- ZEPTOMAIL CONFIG CHECK ---');
  console.log('ZEPTOMAIL_URL:', config.ZEPTOMAIL_URL);
  console.log('ZEPTOMAIL_TOKEN:', config.ZEPTOMAIL_TOKEN ? `${config.ZEPTOMAIL_TOKEN.slice(0, 15)}... (length: ${config.ZEPTOMAIL_TOKEN.length})` : 'MISSING');
  console.log('ZEPTOMAIL_FROM_EMAIL:', config.ZEPTOMAIL_FROM_EMAIL || 'MISSING');
  console.log('Recipient Email:', recipientEmail);
  console.log('-------------------------------\n');

  if (!config.ZEPTOMAIL_TOKEN || !config.ZEPTOMAIL_FROM_EMAIL) {
    console.error('❌ ZEPTOMAIL_TOKEN or ZEPTOMAIL_FROM_EMAIL is missing in environment variables.');
    process.exit(1);
  }

  console.log('Attempting to send email via sendMail helper (direct fetch)...');
  const success = await sendMail(
    {
      to: { address: recipientEmail, name: 'Test User' },
      subject: 'ZeptoMail REST API Test Email',
      htmlBody: '<h1>ZeptoMail Test</h1><p>If you see this, direct HTTP fetch integration is working!</p>',
    },
    console,
  );

  console.log('\nResult of sendMail():', success);
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal error running script:', err);
  process.exit(1);
});
