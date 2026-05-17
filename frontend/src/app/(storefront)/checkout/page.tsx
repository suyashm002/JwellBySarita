'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Truck,
  CreditCard,
  ChevronRight,
  Check,
  Plus,
  Edit2,
  Banknote,
  Shield,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { Address } from '@/types/user';
import { userAPI, orderAPI, paymentAPI } from '@/lib/api';
import { AddressForm } from '@/components/checkout/AddressForm';
import { ShippingOptions } from '@/components/checkout/ShippingOptions';
import { RazorpayButton } from '@/components/checkout/RazorpayButton';
import { CartSummaryPanel } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type CheckoutStep = 1 | 2 | 3;
type PaymentMethod = 'ONLINE' | 'COD';

const STEPS = [
  { step: 1 as const, label: 'Address', icon: MapPin },
  { step: 2 as const, label: 'Shipping', icon: Truck },
  { step: 3 as const, label: 'Payment', icon: CreditCard },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, summary, fetchCart, fetchSummary } = useCartStore();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Shipping options state
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [shippingInsurance, setShippingInsurance] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [razorpayData, setRazorpayData] = useState<{
    orderId: string;
    razorpayOrderId: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    fetchCart();
    fetchSummary();
    loadAddresses();
  }, [fetchCart, fetchSummary]);

  const loadAddresses = async () => {
    try {
      const { data } = await userAPI.getAddresses();
      const list = data.data || [];
      setAddresses(list);
      const defaultAddr = list.find((a: Address) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (list.length > 0) setSelectedAddressId(list[0].id);
    } catch {
      // user may not be logged in
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const handleAddressSave = async (data: any) => {
    try {
      if (editingAddress) {
        await userAPI.updateAddress(editingAddress.id, data);
        toast.success('Address updated');
      } else {
        await userAPI.addAddress(data);
        toast.success('Address added');
      }
      await loadAddresses();
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      setCurrentStep(1);
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderData = {
        addressId: selectedAddress.id,
        paymentMethod,
        giftWrap,
        giftMessage: giftWrap ? giftMessage : undefined,
        shippingInsurance,
        couponCode: summary?.couponCode,
      };

      const { data: orderResponse } = await orderAPI.create(orderData);
      const order = orderResponse.data;

      if (paymentMethod === 'COD') {
        router.push(`/order/success?orderId=${order.id}&orderNumber=${order.orderNumber}`);
        return;
      }

      // Online payment - create Razorpay order
      const { data: paymentResponse } = await paymentAPI.createOrder({
        orderId: order.id,
        amount: order.grandTotal,
      });

      setRazorpayData({
        orderId: order.id,
        razorpayOrderId: paymentResponse.data.razorpayOrderId,
        amount: order.grandTotal,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePaymentSuccess = async (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    try {
      await paymentAPI.verify({
        orderId: razorpayData?.orderId,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
      router.push(`/order/success?orderId=${razorpayData?.orderId}`);
    } catch {
      toast.error('Payment verification failed. Please contact support.');
    }
  };

  const handlePaymentFailure = (error: any) => {
    toast.error(error?.description || 'Payment failed. Please try again.');
    setRazorpayData(null);
  };

  const canProceedToStep2 = !!selectedAddressId;
  const canProceedToStep3 = canProceedToStep2;

  // Redirect if cart is empty
  if (!items.length && !isPlacingOrder) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items to your cart before checking out.</p>
        <Button onClick={() => router.push('/shop')} variant="primary">
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Step indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-center gap-0">
          {STEPS.map(({ step, label, icon: Icon }, index) => (
            <React.Fragment key={step}>
              <button
                onClick={() => {
                  if (step === 1) setCurrentStep(1);
                  else if (step === 2 && canProceedToStep2) setCurrentStep(2);
                  else if (step === 3 && canProceedToStep3) setCurrentStep(3);
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                  currentStep === step
                    ? 'bg-[#722F37] text-white shadow-md'
                    : currentStep > step
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
                disabled={
                  (step === 2 && !canProceedToStep2) || (step === 3 && !canProceedToStep3)
                }
              >
                {currentStep > step ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{step}</span>
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight
                  className={cn(
                    'h-4 w-4 mx-2',
                    currentStep > step ? 'text-emerald-400' : 'text-gray-300'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content - left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-900">Delivery Address</h2>

              {/* Saved addresses */}
              {addresses.length > 0 && !showAddressForm && (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={cn(
                        'block relative border rounded-xl p-4 cursor-pointer transition-all',
                        selectedAddressId === address.id
                          ? 'border-[#722F37] bg-[#722F37]/5 ring-1 ring-[#722F37]'
                          : 'border-gray-200 hover:border-[#B76E79]'
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {address.name}
                            </span>
                            <Badge variant="default">{address.label}</Badge>
                            {address.isDefault && (
                              <Badge variant="success">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {address.line1}
                            {address.line2 && `, ${address.line2}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingAddress(address);
                            setShowAddressForm(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#722F37] hover:bg-[#722F37]/5 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                      {selectedAddressId === address.id && (
                        <div className="absolute top-3 right-12 h-5 w-5 bg-[#722F37] rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {/* Add new address button or form */}
              {showAddressForm ? (
                <div className="border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <AddressForm
                    onSubmit={handleAddressSave}
                    defaultValues={editingAddress || undefined}
                  />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setShowAddressForm(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-sm font-medium text-gray-500 hover:border-[#B76E79] hover:text-[#722F37] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add New Address
                </button>
              )}

              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToStep2}
                className="w-full"
                size="lg"
              >
                Continue to Shipping
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Shipping */}
          {currentStep === 2 && selectedAddress && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-900">Shipping Options</h2>

              {/* Selected address summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#722F37]" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedAddress.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedAddress.line1}, {selectedAddress.city} - {selectedAddress.pincode}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-sm text-[#722F37] hover:text-[#5e262d] font-medium"
                >
                  Change
                </button>
              </div>

              <ShippingOptions
                pincode={selectedAddress.pincode}
                orderValue={summary?.itemsTotal || 0}
                giftWrap={giftWrap}
                giftMessage={giftMessage}
                shippingInsurance={shippingInsurance}
                onGiftWrapChange={setGiftWrap}
                onGiftMessageChange={setGiftMessage}
                onShippingInsuranceChange={setShippingInsurance}
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  size="lg"
                  className="flex-1"
                >
                  Continue to Payment
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>

              {/* Payment method selection */}
              <div className="space-y-3">
                <label
                  className={cn(
                    'flex items-center gap-4 border rounded-xl p-4 cursor-pointer transition-all',
                    paymentMethod === 'ONLINE'
                      ? 'border-[#722F37] bg-[#722F37]/5 ring-1 ring-[#722F37]'
                      : 'border-gray-200 hover:border-[#B76E79]'
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={() => setPaymentMethod('ONLINE')}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                      paymentMethod === 'ONLINE'
                        ? 'border-[#722F37]'
                        : 'border-gray-300'
                    )}
                  >
                    {paymentMethod === 'ONLINE' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#722F37]" />
                    )}
                  </div>
                  <CreditCard className="h-5 w-5 text-[#722F37]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Online Payment</p>
                    <p className="text-xs text-gray-500">
                      UPI, Cards, Net Banking, Wallets via Razorpay
                    </p>
                  </div>
                  <Shield className="h-4 w-4 text-emerald-500" />
                </label>

                <label
                  className={cn(
                    'flex items-center gap-4 border rounded-xl p-4 cursor-pointer transition-all',
                    paymentMethod === 'COD'
                      ? 'border-[#722F37] bg-[#722F37]/5 ring-1 ring-[#722F37]'
                      : 'border-gray-200 hover:border-[#B76E79]'
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                      paymentMethod === 'COD'
                        ? 'border-[#722F37]'
                        : 'border-gray-300'
                    )}
                  >
                    {paymentMethod === 'COD' && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#722F37]" />
                    )}
                  </div>
                  <Banknote className="h-5 w-5 text-[#D4AF37]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when your order arrives</p>
                  </div>
                </label>
              </div>

              {/* Place order / pay button */}
              <div className="pt-3">
                {razorpayData ? (
                  <RazorpayButton
                    amount={razorpayData.amount}
                    orderId={razorpayData.orderId}
                    razorpayOrderId={razorpayData.razorpayOrderId}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                    customerName={selectedAddress?.name}
                    customerPhone={selectedAddress?.phone}
                  />
                ) : (
                  <Button
                    onClick={handlePlaceOrder}
                    loading={isPlacingOrder}
                    size="lg"
                    className="w-full text-base"
                  >
                    {paymentMethod === 'ONLINE'
                      ? `Pay ${summary ? formatCurrency(summary.grandTotal) : ''}`
                      : 'Place Order (COD)'}
                  </Button>
                )}
              </div>

              <Button
                onClick={() => setCurrentStep(2)}
                variant="ghost"
                className="w-full"
              >
                Back to Shipping
              </Button>
            </div>
          )}
        </div>

        {/* Order summary - right sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-4">
            {summary && (
              <CartSummaryPanel summary={summary} showCoupon={false} />
            )}

            {/* Mini items preview */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Items ({items.length})
              </h4>
              {items.slice(0, 3).map((item) => {
                const img =
                  item.product.images?.find((i) => i.isPrimary) || item.product.images?.[0];
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 rounded-md bg-gray-50 border border-gray-200 overflow-hidden">
                      {img && (
                        <img
                          src={img.url}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <span className="absolute -top-1 -right-1 bg-[#722F37] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate flex-1">
                      {item.product.name}
                    </p>
                  </div>
                );
              })}
              {items.length > 3 && (
                <p className="text-xs text-gray-400">+{items.length - 3} more items</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
