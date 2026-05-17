import axios from 'axios';
import { config } from '../../config';
import logger from '../../utils/logger';

export interface WhatsAppOptions {
  to: string;
  message: string;
  mediaUrl?: string;
  templateName?: string;
  templateParams?: string[];
}

export async function sendWhatsApp(options: WhatsAppOptions): Promise<boolean> {
  try {
    if (!config.GUPSHUP_API_KEY) {
      logger.warn('Gupshup API key not configured, skipping WhatsApp');
      logger.info({ to: options.to }, 'WhatsApp message would be sent');
      return true;
    }

    const phone = options.to.startsWith('91') ? options.to : `91${options.to}`;

    if (options.templateName) {
      await axios.post(
        'https://api.gupshup.io/wa/api/v1/template/msg',
        new URLSearchParams({
          channel: 'whatsapp',
          source: config.GUPSHUP_APP_NAME,
          destination: phone,
          'template': JSON.stringify({
            id: options.templateName,
            params: options.templateParams || [],
          }),
        }),
        {
          headers: {
            apikey: config.GUPSHUP_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    } else {
      await axios.post(
        'https://api.gupshup.io/wa/api/v1/msg',
        new URLSearchParams({
          channel: 'whatsapp',
          source: config.GUPSHUP_APP_NAME,
          destination: phone,
          message: JSON.stringify({
            type: options.mediaUrl ? 'image' : 'text',
            text: options.message,
            ...(options.mediaUrl && {
              originalUrl: options.mediaUrl,
              previewUrl: options.mediaUrl,
              caption: options.message,
            }),
          }),
        }),
        {
          headers: {
            apikey: config.GUPSHUP_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    }

    logger.info({ to: options.to }, 'WhatsApp message sent');
    return true;
  } catch (error) {
    logger.error(error, 'Failed to send WhatsApp message');
    return false;
  }
}
