import { shiprocket } from '../../config/shiprocket';
import prisma from '../../config/database';
import logger from '../../utils/logger';

class ShippingService {
  async checkServiceability(pincode: string, weight: number = 0.5) {
    try {
      const data = await shiprocket.checkServiceability(pincode, weight);
      const couriers = data?.data?.available_courier_companies || [];

      const hasCOD = couriers.some((c: any) => c.cod === 1);
      const minDeliveryDays = couriers.length
        ? Math.min(...couriers.map((c: any) => c.estimated_delivery_days || 7))
        : null;

      return {
        serviceable: couriers.length > 0,
        codAvailable: hasCOD,
        estimatedDeliveryDays: minDeliveryDays,
        couriers: couriers.map((c: any) => ({
          name: c.courier_name,
          rate: c.rate,
          estimatedDays: c.estimated_delivery_days,
          cod: c.cod === 1,
        })),
      };
    } catch (error) {
      logger.error(error, 'Serviceability check failed');
      return {
        serviceable: true, // Fallback: assume serviceable
        codAvailable: true,
        estimatedDeliveryDays: 7,
        couriers: [],
      };
    }
  }

  async createShipment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
      },
    });

    if (!order) throw new Error('Order not found');

    const address = order.addressSnapshot as any;
    const totalWeight = order.items.reduce(
      (sum, item) => sum + Number(item.silverWeight) * item.quantity,
      0
    );

    try {
      const shipmentData = {
        order_id: order.orderNumber,
        order_date: order.createdAt.toISOString().split('T')[0],
        pickup_location: 'Primary',
        billing_customer_name: address.name,
        billing_last_name: '',
        billing_address: address.line1,
        billing_address_2: address.line2 || '',
        billing_city: address.city,
        billing_pincode: address.pincode,
        billing_state: address.state,
        billing_country: 'India',
        billing_email: order.user?.email || '',
        billing_phone: address.phone,
        shipping_is_billing: true,
        order_items: order.items.map((item) => {
          const snapshot = item.productSnapshot as any;
          return {
            name: snapshot.name,
            sku: snapshot.sku,
            units: item.quantity,
            selling_price: Number(item.unitPrice),
            discount: 0,
            tax: 3,
            hsn: '7113',
          };
        }),
        payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        sub_total: Number(order.grandTotal),
        length: 15,
        breadth: 10,
        height: 5,
        weight: Math.max(totalWeight / 1000, 0.1), // Convert grams to kg, min 100g
      };

      const result = await shiprocket.createOrder(shipmentData);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          shiprocketOrderId: String(result.order_id),
          shiprocketShipmentId: String(result.shipment_id),
        },
      });

      return result;
    } catch (error) {
      logger.error(error, 'Failed to create shipment');
      throw error;
    }
  }

  async trackShipment(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.shiprocketShipmentId) {
      return { status: order?.status, tracking: null };
    }

    try {
      const tracking = await shiprocket.trackShipment(order.shiprocketShipmentId);
      return { status: order.status, tracking };
    } catch (error) {
      logger.error(error, 'Tracking failed');
      return { status: order.status, tracking: null };
    }
  }

  calculateShippingCost(orderValue: number, weight: number, pincode: string): number {
    // Free shipping above ₹2000
    if (orderValue >= 2000) return 0;

    // Basic weight-based calculation (fallback when Shiprocket rates unavailable)
    if (weight <= 100) return 60;
    if (weight <= 250) return 80;
    if (weight <= 500) return 100;
    return 150;
  }

  calculateInsurance(orderValue: number): number {
    // Insurance: 1% of order value for orders above ₹10,000
    if (orderValue >= 10000) {
      return Math.round(orderValue * 0.01);
    }
    return 0;
  }
}

export const shippingService = new ShippingService();
export default shippingService;
