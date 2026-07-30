/**
 * Test ZeptoMail Email Dispatch Script
 *
 * Usage from `apps/server`:
 *   npx tsx --env-file=.env src/scripts/test-zeptomail.ts <RECIPIENT_EMAIL>
 */

import Fastify from 'fastify';
import envPlugin, { getConfig } from '../config/env.js';
import { sendMail } from '../lib/zeptomail.js';
import { SendMailClient } from 'zeptomail';

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
  console.log('ZEPTOMAIL_TOKEN:', config.ZEPTOMAIL_TOKEN ? `${config.ZEPTOMAIL_TOKEN.slice(0, 10)}... (length: ${config.ZEPTOMAIL_TOKEN.length})` : 'MISSING');
  console.log('ZEPTOMAIL_FROM_EMAIL:', config.ZEPTOMAIL_FROM_EMAIL || 'MISSING');
  console.log('Recipient Email:', recipientEmail);
  console.log('-------------------------------\n');

  if (!config.ZEPTOMAIL_TOKEN || !config.ZEPTOMAIL_FROM_EMAIL) {
    console.error('❌ ZEPTOMAIL_TOKEN or ZEPTOMAIL_FROM_EMAIL is missing in environment variables.');
    process.exit(1);
  }

  console.log('Attempting to send email via sendMail helper...');
  const success = await sendMail(
    {
      to: { address: recipientEmail, name: 'Test User' },
      subject: 'ZeptoMail Test Email',
      htmlBody: '<h1>ZeptoMail Test</h1><p>If you see this, ZeptoMail integration is working!</p>',
    },
    console,
  );

  console.log('\nResult of sendMail():', success);

  console.log('\n--- Direct SendMailClient Execution for Inspection ---');
  try {
    const client = new SendMailClient({
      url: config.ZEPTOMAIL_URL || 'api.zeptomail.in/',
      token: config.ZEPTOMAIL_TOKEN,
    });

    const response = await client.sendMail({
      from: {
        address: config.ZEPTOMAIL_FROM_EMAIL,
        name: 'VastraHub Test',
      },
      to: [
        {
          email_address: {
            address: recipientEmail,
            name: 'Test User',
          },
        },
      ],
      subject: 'ZeptoMail Direct Test',
      htmlbody: '<h1>Direct Test</h1>',
    });

    console.log('✅ Direct SendMailClient Success!');
    console.dir(response, { depth: null, colors: true });
  } catch (err: any) {
    console.error('❌ Direct SendMailClient Error caught!');
    console.dir(err, { depth: null, colors: true });
    if (err && typeof err === 'object') {
      console.log('Error Keys:', Object.keys(err));
      console.log('Error Prototype:', Object.getPrototypeOf(err));
      for (const key of Object.getOwnPropertyNames(err)) {
        console.log(`err[${key}]:`, err[key]);
      }
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error running script:', err);
  process.exit(1);
});
