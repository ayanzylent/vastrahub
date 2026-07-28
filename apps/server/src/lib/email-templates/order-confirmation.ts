/**
 * Order confirmation email template.
 *
 * Pure function — takes order data and returns `{ subject, htmlBody }`.
 * No side effects, no I/O. All prices are in paise and formatted to ₹.
 */

import type { IOrderDocument } from '../../db/models/index.js';
import { BRAND_CONFIG } from '../../constants/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────

/** Convert paise to formatted INR string (e.g. 149900 → "₹1,499.00"). */
function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format a Date to a readable string (e.g. "28 Jul 2026"). */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Template ────────────────────────────────────────────────────────

export interface OrderConfirmationEmailData {
  order: IOrderDocument;
  customerName: string;
  customerEmail: string;
  frontendUrl: string;
  paymentMethod: string;
}

export function buildOrderConfirmationEmail(data: OrderConfirmationEmailData): {
  subject: string;
  htmlBody: string;
} {
  const { order, customerName, frontendUrl, paymentMethod } = data;
  const brandName = BRAND_CONFIG.NAME;

  const subject = `Order Confirmed — ${order.orderNumber} | ${brandName}`;

  // Build items rows
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-family: 'Segoe UI', Arial, sans-serif;">
            <div style="font-weight: 600; color: #1a1a2e; font-size: 14px;">${escapeHtml(item.productName)}</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">${escapeHtml(item.variantLabel)} · SKU: ${escapeHtml(item.skuCode)}</div>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #374151; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;">
            ${item.quantity}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #374151; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;">
            ${formatPaise(item.pricePaise)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #1a1a2e; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;">
            ${formatPaise(item.totalPaise)}
          </td>
        </tr>`,
    )
    .join('');

  // Payment badge
  const paymentLabel =
    paymentMethod === 'cod'
      ? 'Cash on Delivery'
      : paymentMethod === 'icici'
        ? 'Paid Online (ICICI)'
        : paymentMethod === 'razorpay'
          ? 'Paid Online (Razorpay)'
          : 'Online Payment';

  const paymentBadgeColor = paymentMethod === 'cod' ? '#f59e0b' : '#10b981';

  // Shipping address
  const addr = order.shippingAddress;
  const addressLines = [
    addr.fullName,
    addr.addressLine1,
    addr.addressLine2,
    `${addr.city}, ${addr.state} — ${addr.pincode}`,
    addr.phone,
  ]
    .filter((line): line is string => Boolean(line))
    .map(escapeHtml)
    .join('<br>');

  // Pricing rows
  const pricingRows: Array<{ label: string; value: string; bold?: boolean }> = [
    { label: 'Subtotal', value: formatPaise(order.pricing.subtotalPaise) },
  ];
  if (order.pricing.discountPaise > 0) {
    pricingRows.push({ label: 'Discount', value: `−${formatPaise(order.pricing.discountPaise)}` });
  }
  if (order.pricing.shippingPaise > 0) {
    pricingRows.push({ label: 'Shipping', value: formatPaise(order.pricing.shippingPaise) });
  } else {
    pricingRows.push({ label: 'Shipping', value: 'FREE' });
  }
  if (order.pricing.taxPaise > 0) {
    pricingRows.push({ label: 'Tax', value: formatPaise(order.pricing.taxPaise) });
  }
  pricingRows.push({ label: 'Total', value: formatPaise(order.pricing.totalPaise), bold: true });

  const pricingSummaryHtml = pricingRows
    .map(
      (row) => `
        <tr>
          <td style="padding: 6px 16px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: ${row.bold ? '#1a1a2e' : '#6b7280'}; ${row.bold ? 'font-weight: 700; font-size: 16px; padding-top: 12px; border-top: 2px solid #e5e7eb;' : ''}">
            ${row.label}
          </td>
          <td style="padding: 6px 16px; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: ${row.bold ? '#1a1a2e' : '#374151'}; ${row.bold ? 'font-weight: 700; font-size: 16px; padding-top: 12px; border-top: 2px solid #e5e7eb;' : ''}">
            ${row.value}
          </td>
        </tr>`,
    )
    .join('');

  const orderUrl = `${frontendUrl}/account/orders/${String(order._id)}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed — ${escapeHtml(order.orderNumber)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">
                ${escapeHtml(brandName)}
              </h1>
            </td>
          </tr>

          <!-- Success Icon & Title -->
          <tr>
            <td style="padding: 32px 24px 16px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 16px; background-color: #ecfdf5; border-radius: 50%; line-height: 64px; font-size: 32px;">
                ✓
              </div>
              <h2 style="margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1a1a2e;">
                Order Confirmed!
              </h2>
              <p style="margin: 8px 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #6b7280;">
                Hi ${escapeHtml(customerName)}, thank you for your order.
              </p>
            </td>
          </tr>

          <!-- Order Info Bar -->
          <tr>
            <td style="padding: 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 16px; text-align: center; border-right: 1px solid #e5e7eb;">
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Order No.</div>
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 700; color: #1a1a2e; margin-top: 4px;">${escapeHtml(order.orderNumber)}</div>
                  </td>
                  <td style="padding: 16px; text-align: center; border-right: 1px solid #e5e7eb;">
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Date</div>
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #374151; margin-top: 4px;">${formatDate(order.createdAt)}</div>
                  </td>
                  <td style="padding: 16px; text-align: center;">
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Payment</div>
                    <div style="margin-top: 4px;">
                      <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #ffffff; background-color: ${paymentBadgeColor};">
                        ${escapeHtml(paymentLabel)}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 24px;">
              <h3 style="margin: 0 0 12px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 700; color: #1a1a2e;">
                Items Ordered
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 10px 16px; text-align: left; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
                    <th style="padding: 10px 16px; text-align: center; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                    <th style="padding: 10px 16px; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                    <th style="padding: 10px 16px; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Pricing Summary + Shipping Address -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Shipping Address -->
                  <td style="vertical-align: top; width: 50%; padding-right: 12px;">
                    <h3 style="margin: 0 0 8px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #1a1a2e;">
                      Shipping Address
                    </h3>
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #374151; line-height: 1.6; background-color: #f8fafc; border-radius: 8px; padding: 12px; border: 1px solid #e5e7eb;">
                      ${addressLines}
                    </div>
                  </td>
                  <!-- Pricing -->
                  <td style="vertical-align: top; width: 50%; padding-left: 12px;">
                    <h3 style="margin: 0 0 8px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #1a1a2e;">
                      Order Summary
                    </h3>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
                      ${pricingSummaryHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 24px 32px; text-align: center;">
              <a href="${orderUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; letter-spacing: 0.3px;">
                View Your Order →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #6b7280;">
                Questions? Reply to this email or reach us at our support page.
              </p>
              <p style="margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} ${escapeHtml(brandName)}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, htmlBody };
}

// ─── Sanitisation ────────────────────────────────────────────────────

/** Minimal HTML-entity escaping for user-supplied text inside the template. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
