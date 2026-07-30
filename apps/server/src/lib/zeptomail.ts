/**
 * ZeptoMail client — thin wrapper around the `zeptomail` SDK.
 *
 * Initialises a singleton `SendMailClient` and exposes `sendMail()`.
 * Both `ZEPTOMAIL_TOKEN` and `ZEPTOMAIL_FROM_EMAIL` are required for
 * email to work. If either is missing, an error is logged and sending
 * is skipped.
 */

import { SendMailClient } from 'zeptomail';
import { getConfig } from '../config/env.js';
import { BRAND_CONFIG } from '../constants/index.js';

// ─── Singleton client ────────────────────────────────────────────────

let _client: InstanceType<typeof SendMailClient> | null = null;

function getClient(): InstanceType<typeof SendMailClient> | null {
  if (_client) return _client;

  const token = getConfig().ZEPTOMAIL_TOKEN;
  if (!token) return null;

  _client = new SendMailClient({
    url: 'api.zeptomail.com/',
    token,
  });
  return _client;
}

// ─── Public helper ───────────────────────────────────────────────────

export interface ZeptoMailOptions {
  to: { address: string; name?: string };
  subject: string;
  htmlBody: string;
}

/**
 * Send a transactional email via ZeptoMail.
 *
 * **Fire-and-forget** — callers should not `await` this unless they
 * specifically need the result. Errors are caught and logged so they
 * never disrupt the calling flow.
 *
 * Both `ZEPTOMAIL_TOKEN` and `ZEPTOMAIL_FROM_EMAIL` must be configured.
 * If either is missing, an error is logged and the send is skipped.
 *
 * @returns `true` if the mail was accepted, `false` otherwise.
 */
export async function sendMail(
  opts: ZeptoMailOptions,
  logger?: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void },
): Promise<boolean> {
  const config = getConfig();

  if (!config.ZEPTOMAIL_TOKEN) {
    logger?.error('[ZeptoMail] ZEPTOMAIL_TOKEN is not configured — email not sent');
    return false;
  }

  if (!config.ZEPTOMAIL_FROM_EMAIL) {
    logger?.error('[ZeptoMail] ZEPTOMAIL_FROM_EMAIL is not configured — email not sent');
    return false;
  }

  const client = getClient();
  if (!client) {
    logger?.error('[ZeptoMail] Failed to initialise mail client — email not sent');
    return false;
  }

  try {
    await client.sendMail({
      from: {
        address: config.ZEPTOMAIL_FROM_EMAIL,
        name: BRAND_CONFIG.NAME,
      },
      to: [
        {
          email_address: {
            address: opts.to.address,
            name: opts.to.name ?? opts.to.address,
          },
        },
      ],
      subject: opts.subject,
      htmlbody: opts.htmlBody,
    });
    logger?.info({ to: opts.to.address, subject: opts.subject }, '[ZeptoMail] Email sent successfully');
    return true;
  } catch (err) {
    logger?.error({ err, to: opts.to.address, subject: opts.subject }, '[ZeptoMail] Failed to send email');
    return false;
  }
}
