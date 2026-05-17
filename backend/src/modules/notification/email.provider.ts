import sgMail from '../../config/mailer';
import { config } from '../../config';
import logger from '../../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!config.SENDGRID_API_KEY) {
      logger.warn('SendGrid API key not configured, skipping email');
      logger.info({ to: options.to, subject: options.subject }, 'Email would be sent');
      return true;
    }

    await sgMail.send({
      to: options.to,
      from: { email: config.EMAIL_FROM, name: 'Jewelup by Sarita' },
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    });

    logger.info({ to: options.to, subject: options.subject }, 'Email sent');
    return true;
  } catch (error) {
    logger.error(error, 'Failed to send email');
    return false;
  }
}

export function buildAbandonedCartEmail(data: {
  customerName: string;
  cartItems: { name: string; image: string; price: number }[];
  resumeLink: string;
  discountCode?: string;
  discountPercent?: number;
}): string {
  const itemsHtml = data.cartItems
    .map(
      (item) => `
      <tr>
        <td style="padding:12px"><img src="${item.image}" width="80" style="border-radius:8px" /></td>
        <td style="padding:12px;font-family:sans-serif">${item.name}</td>
        <td style="padding:12px;font-family:sans-serif;font-weight:bold">₹${item.price.toLocaleString('en-IN')}</td>
      </tr>`
    )
    .join('');

  const discountBlock = data.discountCode
    ? `<p style="font-family:sans-serif;font-size:16px;background:#f8f4f0;padding:16px;border-radius:8px;text-align:center">
        Use code <strong>${data.discountCode}</strong> for ${data.discountPercent}% off!
       </p>`
    : '';

  return `
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="background:#722F37;padding:24px;text-align:center">
        <h1 style="color:#fff;font-family:serif;margin:0">Jewelup by Sarita</h1>
      </div>
      <div style="padding:24px">
        <h2 style="font-family:serif;color:#333">Hi ${data.customerName},</h2>
        <p style="font-family:sans-serif;color:#555;line-height:1.6">
          You left some beautiful pieces in your cart. They're waiting for you!
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          ${itemsHtml}
        </table>
        ${discountBlock}
        <div style="text-align:center;margin:24px 0">
          <a href="${data.resumeLink}" style="background:#B76E79;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-weight:bold;display:inline-block">
            Complete Your Purchase
          </a>
        </div>
      </div>
      <div style="background:#f8f4f0;padding:16px;text-align:center">
        <p style="font-family:sans-serif;color:#888;font-size:12px;margin:0">
          BIS Hallmarked Silver | Certified Gemstones | Insured Shipping
        </p>
      </div>
    </div>
  `;
}

export function buildOrderConfirmationEmail(data: {
  customerName: string;
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  grandTotal: number;
  estimatedDelivery?: string;
}): string {
  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr><td style="padding:8px;font-family:sans-serif;border-bottom:1px solid #eee">${item.name} x ${item.quantity}</td>
         <td style="padding:8px;font-family:sans-serif;text-align:right;border-bottom:1px solid #eee">₹${item.price.toLocaleString('en-IN')}</td></tr>`
    )
    .join('');

  return `
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="background:#722F37;padding:24px;text-align:center">
        <h1 style="color:#fff;font-family:serif;margin:0">Order Confirmed!</h1>
      </div>
      <div style="padding:24px">
        <h2 style="font-family:serif;color:#333">Thank you, ${data.customerName}!</h2>
        <p style="font-family:sans-serif;color:#555">Order #${data.orderNumber} has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          ${itemsHtml}
          <tr>
            <td style="padding:12px;font-family:sans-serif;font-weight:bold;font-size:18px">Total</td>
            <td style="padding:12px;font-family:sans-serif;font-weight:bold;font-size:18px;text-align:right">₹${data.grandTotal.toLocaleString('en-IN')}</td>
          </tr>
        </table>
        ${data.estimatedDelivery ? `<p style="font-family:sans-serif;color:#555">Estimated delivery: ${data.estimatedDelivery}</p>` : ''}
      </div>
    </div>
  `;
}
