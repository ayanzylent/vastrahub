/**
 * ZeptoMail client — thin wrapper around the `zeptomail` SDK.
 *
 * Initialises a singleton `SendMailClient` and exposes `sendMail()`.
 * If `ZEPTOMAIL_TOKEN` is empty the helper silently no-ops so the app
 * works without email configured (dev / staging).
 */

import { SendMailClient } from 'zeptomail';
import { getConfig } from '../config/env.js';

// ─── Singleton client ────────────────────────────────────────────────

let _client: InstanceType<typeof SendMailClient> | null = null;

function getClient(): InstanceType<typeof SendMailClient> | null {
  if (_client) return _client;

  const token = getConfig().ZEPTOMAIL_TOKEN;
  if (!token) return null; // email not configured

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
 * @returns `true` if the mail was accepted, `false` otherwise.
 */
export async function sendMail(
  opts: ZeptoMailOptions,
  logger?: { error: (...args: unknown[]) => void },
): Promise<boolean> {
  const client = getClient();
  if (!client) {
    logger?.error('[ZeptoMail] Skipped — ZEPTOMAIL_TOKEN is not configured');
    return false;
  }

  const config = getConfig();
  const fromAddress = config.ZEPTOMAIL_FROM_EMAIL || 'noreply@vastrahub.com';

  try {
    await client.sendMail({
      from: {
        address: fromAddress,
        name: 'VastraHub',
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
    return true;
  } catch (err) {
    logger?.error({ err, to: opts.to.address, subject: opts.subject }, '[ZeptoMail] Failed to send email');
    return false;
  }
}
