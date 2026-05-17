import axios from 'axios';
import { config } from '../../config';
import logger from '../../utils/logger';

export interface SMSOptions {
  to: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  try {
    if (!config.MSG91_AUTH_KEY) {
      logger.warn('MSG91 auth key not configured, skipping SMS');
      logger.info({ to: options.to }, 'SMS would be sent');
      return true;
    }

    const phone = options.to.startsWith('91') ? options.to : `91${options.to}`;

    await axios.post(
      'https://control.msg91.com/api/v5/flow/',
      {
        template_id: options.templateId || config.MSG91_TEMPLATE_ID,
        sender: config.MSG91_SENDER_ID,
        short_url: '1',
        mobiles: phone,
        ...options.variables,
      },
      {
        headers: {
          authkey: config.MSG91_AUTH_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info({ to: options.to }, 'SMS sent');
    return true;
  } catch (error) {
    logger.error(error, 'Failed to send SMS');
    return false;
  }
}

export async function sendOTP(phone: string, otp: string): Promise<boolean> {
  return sendSMS({
    to: phone,
    message: `Your Jewelup verification code is ${otp}. Valid for 5 minutes.`,
    variables: { OTP: otp },
  });
}
