import Razorpay from 'razorpay';
import { config } from './index';

let razorpay: Razorpay | null = null;

if (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('Razorpay not configured — payment features disabled');
}

export { razorpay };
export default razorpay;
