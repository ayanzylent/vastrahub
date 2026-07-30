/**
 * ZeptoMail HTTP client — direct REST API wrapper via fetch.
 *
 * Sends transactional emails using ZeptoMail's v1.1 REST API:
 * POST https://api.zeptomail.in/v1.1/email
 */

import { getConfig } from '../config/env.js';
import { BRAND_CONFIG } from '../constants/index.js';

export interface ZeptoMailOptions {
  to: { address: string; name?: string };
  subject: string;
  htmlBody: string;
}

/**
 * Send a transactional email via ZeptoMail REST API.
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
  logger: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void } = console,
): Promise<boolean> {
  const config = getConfig();

  if (!config.ZEPTOMAIL_TOKEN) {
    logger.error('[ZeptoMail] ZEPTOMAIL_TOKEN is not configured — email not sent');
    return false;
  }

  if (!config.ZEPTOMAIL_FROM_EMAIL) {
    logger.error('[ZeptoMail] ZEPTOMAIL_FROM_EMAIL is not configured — email not sent');
    return false;
  }

  const endpoint = config.ZEPTOMAIL_URL || 'https://api.zeptomail.in/v1.1/email';

  // Ensure Authorization header has the token format expected by ZeptoMail REST API
  const token = config.ZEPTOMAIL_TOKEN.trim();
  const authHeader = token.startsWith('Zoho-enczapikey ') ? token : `Zoho-enczapikey ${token}`;

  const payload = {
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
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok || (data && data.error)) {
      logger.error(
        `[ZeptoMail] Failed to send email to ${opts.to.address} | Status: ${response.status} | Error:`,
        JSON.stringify(data || response.statusText, null, 2),
      );
      return false;
    }

    logger.info({ to: opts.to.address, subject: opts.subject, data }, '[ZeptoMail] Email sent successfully');
    return true;
  } catch (err: unknown) {
    logger.error(`[ZeptoMail] Network error sending email to ${opts.to.address}:`, String(err));
    return false;
  }
}
