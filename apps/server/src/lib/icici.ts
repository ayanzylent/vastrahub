/**
 * ICICI Bank Payment Gateway integration.
 *
 * Implements the redirect (hosted-page) checkout flow plus the Command API
 * transaction-status query, per the ICICI PG API spec:
 *
 *   - Initiate Sale .......... POST {BASE}/pg/api/v2/initiateSale   (JSON, secureHash v2)
 *   - Transaction Status ..... POST {BASE}/tsp/pg/api/command       (form, secureHash v1)
 *   - Payment callback ....... ICICI POSTs to our returnURL         (form, secureHash v1)
 *
 * secureHash:
 *   v2 (JSON)  → HMAC-SHA256 over the minified JSON string (excluding `secureHash`),
 *                hex-encoded, lowercased.
 *   v1 (form)  → HMAC-SHA256 over the concatenation of parameter VALUES sorted by
 *                ascending parameter NAME (excluding `secureHash` and empty values),
 *                hex-encoded, lowercased.
 */

import crypto from 'node:crypto';
import { getConfig } from '../config/env.js';
import { AppError, ValidationError } from './errors.js';

// ─── Constants ───────────────────────────────────────────────────────
const INITIATE_SALE_PATH = '/pg/api/v2/initiateSale';
const COMMAND_PATH = '/tsp/pg/api/command';
const CURRENCY_INR = '356';
const REQUEST_TIMEOUT_MS = 20_000;

/** Normalised result of any ICICI payment event (callback, webhook, status query). */
export type IciciOutcome = 'paid' | 'failed' | 'pending';

export interface IciciInitiateResult {
  /** Our unique reference sent as `merchantTxnNo` — stored as the payment's gatewayOrderId. */
  merchantTxnNo: string;
  /** URL the browser must be redirected to in order to complete payment. */
  redirectURI: string;
  /** Raw gateway response (persisted for audit). */
  raw: Record<string, unknown>;
}

export interface IciciStatusResult {
  outcome: IciciOutcome;
  gatewayPaymentId?: string;
  raw: Record<string, unknown>;
}

interface IciciResolvedConfig {
  merchantId: string;
  aggregatorID: string;
  secret: string;
  baseURL: string;
  returnURL: string;
  webhookSecret: string;
}

// ─── Config ──────────────────────────────────────────────────────────

/**
 * Resolve and validate ICICI configuration.
 * Throws if the merchant credentials are not configured.
 */
function getIciciConfig(): IciciResolvedConfig {
  const config = getConfig();
  if (!config.ICICI_MERCHANT_ID || !config.ICICI_SHARED_SECRET) {
    throw new ValidationError(
      'ICICI is not configured. Set ICICI_MERCHANT_ID and ICICI_SHARED_SECRET in .env',
      'ICICI_NOT_CONFIGURED',
    );
  }

  return {
    merchantId: config.ICICI_MERCHANT_ID,
    aggregatorID: config.ICICI_AGGREGATOR_ID || '',
    secret: config.ICICI_SHARED_SECRET,
    baseURL: (config.ICICI_BASE_URL || 'https://pgpayuat.icicibank.com').replace(/\/+$/, ''),
    returnURL: getIciciReturnURL(),
    webhookSecret: config.ICICI_WEBHOOK_SECRET || config.ICICI_SHARED_SECRET,
  };
}

/** Public callback URL ICICI POSTs the payment result to. */
export function getIciciReturnURL(): string {
  const config = getConfig();
  if (config.ICICI_RETURN_URL) return config.ICICI_RETURN_URL;
  const base = (config.BETTER_AUTH_URL || `http://localhost:${config.PORT}`).replace(/\/+$/, '');
  return `${base}/api/v1/payment/icici/callback`;
}

// ─── secureHash ──────────────────────────────────────────────────────
//
// One algorithm for every ICICI request and response. ICICI defines a fixed
// `HashKey` field order (addlParam1, addlParam2, aggregatorID, amount,
// currencyCode, customerEmailID, customerMobileNo, customerName, merchantId,
// merchantTxnNo, payType, returnURL, transactionType, txnDate) — which is simply
// ascending field-name order. We build the hash text by concatenating the VALUES
// of all present fields in that order (no names, spaces, or separators), then
// HMAC-SHA256 it. The resulting `secureHash` is sent as a field in the request
// BODY (not a header).

/**
 * Build the hash text: concatenate field VALUES in ascending field-name order
 * (ICICI's HashKey order). `secureHash` and empty/null values are excluded.
 */
export function buildIciciHashText(fields: Record<string, unknown>): string {
  return Object.keys(fields)
    .filter((key) => key !== 'secureHash')
    .filter((key) => fields[key] !== undefined && fields[key] !== null && String(fields[key]) !== '')
    .sort()
    .map((key) => String(fields[key]))
    .join('');
}

/**
 * Compute the ICICI secureHash for a set of fields: HMAC-SHA256 over the
 * concatenated values (HashKey order), hex-encoded and lowercased.
 */
export function computeIciciSecureHash(
  fields: Record<string, unknown>,
  secret: string,
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(buildIciciHashText(fields), 'utf8')
    .digest('hex')
    .toLowerCase();
}

/** Constant-time comparison of two hex signatures. */
function hashesMatch(expected: string, received: string | undefined): boolean {
  if (!received) return false;
  const a = Buffer.from(expected.toLowerCase(), 'utf8');
  const b = Buffer.from(String(received).toLowerCase(), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verify the secureHash on any inbound ICICI payload (callback or webhook).
 * Recomputes the hash over all received fields (excluding `secureHash` itself)
 * and compares against the `secureHash` field in the body.
 * Uses the webhook secret (falls back to the shared secret).
 */
export function verifyIciciHash(fields: Record<string, unknown>): boolean {
  const { webhookSecret } = getIciciConfig();
  const expected = computeIciciSecureHash(fields, webhookSecret);
  return hashesMatch(expected, fields.secureHash as string | undefined);
}

// ─── Outcome mapping ─────────────────────────────────────────────────

/**
 * Normalise an ICICI response (callback, webhook, or status query) into a
 * payment outcome.
 *
 * - `txnStatus` (Command API) takes priority: SUC → paid, REJ → failed, REQ → pending.
 * - Otherwise `responseCode`: 000/0000 → paid; any other non-empty value → failed.
 */
export function mapIciciOutcome(fields: Record<string, unknown>): IciciStatusResult {
  const txnStatus = String(fields.txnStatus ?? '').toUpperCase();
  const responseCode = String(fields.responseCode ?? fields.returnCode ?? '').trim();
  const gatewayPaymentId = pickIciciPaymentId(fields);

  let outcome: IciciOutcome;
  if (txnStatus) {
    outcome = txnStatus === 'SUC' ? 'paid' : txnStatus === 'REQ' ? 'pending' : 'failed';
  } else if (responseCode === '000' || responseCode === '0000') {
    outcome = 'paid';
  } else if (responseCode) {
    outcome = 'failed';
  } else {
    // Nothing definitive to act on — treat as still pending rather than failing.
    outcome = 'pending';
  }

  return { outcome, gatewayPaymentId, raw: fields };
}

/** Extract the gateway payment/transaction id from a response under any of its known keys. */
export function pickIciciPaymentId(fields: Record<string, unknown>): string | undefined {
  const candidate = fields.paymentID ?? fields.paymentId ?? fields.txnID ?? fields.txnId;
  return candidate ? String(candidate) : undefined;
}

// ─── HTTP helpers ────────────────────────────────────────────────────

async function postJson(
  url: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return iciciFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function postForm(
  url: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  return iciciFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
}

async function iciciFetch(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  console.log({
    ICICI_URL: url,
    REQ_BODY: init
  })
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    throw new AppError(
      502,
      `Failed to reach ICICI gateway: ${err instanceof Error ? err.message : 'network error'}`,
      'ICICI_UNREACHABLE',
    );
  }

  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new AppError(502, 'ICICI gateway returned a non-JSON response', 'ICICI_BAD_RESPONSE', {
        status: res.status,
        body: text.slice(0, 500),
      });
    }
  }

  if (!res.ok) {
    throw new AppError(502, `ICICI gateway error (HTTP ${res.status})`, 'ICICI_HTTP_ERROR', parsed);
  }

  return parsed;
}

// ─── Formatting ──────────────────────────────────────────────────────

/** Format integer paise as the Numeric(9,2) amount string ICICI expects (e.g. "100.00"). */
export function formatIciciAmount(amountPaise: number): string {
  return (amountPaise / 100).toFixed(2);
}

/**
 * Format a Date as ICICI's `txnDate`: YYYYMMDDHHMISS.
 *
 * NOTE: We must format the date explicitly in Indian Standard Time (Asia/Kolkata)
 * because ICICI Bank operates in IST. If we format using system timezone (which
 * defaults to UTC on hosted environments like Render), ICICI will reject the
 * transaction with error code P1006 (Invalid Transaction Date) due to the
 * 5.5-hour time mismatch.
 */
export function formatIciciTxnDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  return `${partMap.year}${partMap.month}${partMap.day}${partMap.hour}${partMap.minute}${partMap.second}`;
}

// ─── API: Initiate Sale (Flow A — redirect) ──────────────────────────

/**
 * Initiate a SALE transaction in redirect mode (payType=0).
 * Returns the `redirectURI` the browser must be sent to.
 *
 * @param amountPaise   Order total in paise.
 * @param merchantTxnNo Unique alphanumeric order reference (we use the order number).
 */
export async function initiateIciciSale(
  amountPaise: number,
  orderNumber: string,
): Promise<IciciInitiateResult> {
  const config = getIciciConfig();
  const merchantTxnNo = `ICICI${orderNumber}`;

  const payload: Record<string, unknown> = {
    merchantId: config.merchantId,
    ...(config.aggregatorID ? { aggregatorID: config.aggregatorID } : {}),
    merchantTxnNo,
    amount: formatIciciAmount(amountPaise),
    currencyCode: CURRENCY_INR,
    payType: '0',
    transactionType: 'SALE',
    returnURL: config.returnURL,
    txnDate: formatIciciTxnDate(new Date()),
  };

  // Hash over the concatenated field values (HashKey order); send the result as
  // the `secureHash` field in the JSON body.
  payload.secureHash = computeIciciSecureHash(payload, config.secret);

  const raw = await postJson(`${config.baseURL}${INITIATE_SALE_PATH}`, payload);

  const responseCode = String(raw.responseCode ?? '');
  let redirectURI = raw.redirectURI ? String(raw.redirectURI) : '';
  const tranCtx = raw.tranCtx ? String(raw.tranCtx) : '';

  if (responseCode !== 'R1000' || !redirectURI) {
    throw new AppError(
      502,
      `ICICI initiateSale failed: ${raw.respDescription ?? responseCode ?? 'unknown error'}`,
      'ICICI_INITIATE_FAILED',
      raw,
    );
  }

  if (tranCtx) {
    const separator = redirectURI.includes('?') ? '&' : '?';
    redirectURI = `${redirectURI}${separator}tranCtx=${tranCtx}`;
  }

  return { merchantTxnNo, redirectURI, raw };
}
// ─── API: Transaction Status (Command API) ───────────────────────────

/**
 * Query the status of a previously-initiated transaction.
 * Used to reconcile payments that are still "processing" (txnStatus REQ).
 *
 * @param merchantTxnNo The original order reference used at initiateSale.
 */
export async function queryIciciTransactionStatus(
  merchantTxnNo: string,
): Promise<IciciStatusResult> {
  const config = getIciciConfig();

  const params: Record<string, string> = {
    merchantId: config.merchantId,
    ...(config.aggregatorID ? { aggregatorID: config.aggregatorID } : {}),
    // A fresh unique reference for *this* command request.
    merchantTxnNo: `STS${merchantTxnNo}`.slice(0, 20),
    originalTxnNo: merchantTxnNo,
    transactionType: 'STATUS',
  };
  params.secureHash = computeIciciSecureHash(params, config.secret);

  const raw = await postForm(`${config.baseURL}${COMMAND_PATH}`, params);
  return mapIciciOutcome(raw);
}