import axios, { AxiosInstance } from 'axios';
import { config } from './index';
import redis from './redis';

class ShiprocketClient {
  private api: AxiosInstance;
  private tokenKey = 'shiprocket:token';

  constructor() {
    this.api = axios.create({
      baseURL: config.SHIPROCKET_API_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use(async (reqConfig) => {
      const token = await this.getToken();
      if (token) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
      }
      return reqConfig;
    });
  }

  private async getToken(): Promise<string | null> {
    let token = await redis.get(this.tokenKey);
    if (token) return token;

    try {
      const { data } = await axios.post(`${config.SHIPROCKET_API_URL}/auth/login`, {
        email: config.SHIPROCKET_EMAIL,
        password: config.SHIPROCKET_PASSWORD,
      });
      token = data.token;
      if (token) {
        await redis.setex(this.tokenKey, 86400, token); // 24h TTL
      }
      return token;
    } catch (error) {
      console.error('Shiprocket auth failed:', error);
      return null;
    }
  }

  async checkServiceability(pincode: string, weight: number) {
    const { data } = await this.api.get('/courier/serviceability/', {
      params: { pickup_postcode: '302001', delivery_postcode: pincode, weight, cod: 1 },
    });
    return data;
  }

  async createOrder(orderData: Record<string, unknown>) {
    const { data } = await this.api.post('/orders/create/adhoc', orderData);
    return data;
  }

  async trackShipment(shipmentId: string) {
    const { data } = await this.api.get(`/courier/track/shipment/${shipmentId}`);
    return data;
  }
}

export const shiprocket = new ShiprocketClient();
export default shiprocket;
