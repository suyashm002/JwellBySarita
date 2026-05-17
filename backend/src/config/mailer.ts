import sgMail from '@sendgrid/mail';
import { config } from './index';

if (config.SENDGRID_API_KEY && config.SENDGRID_API_KEY.startsWith('SG.')) {
  sgMail.setApiKey(config.SENDGRID_API_KEY);
}

export { sgMail };
export default sgMail;
