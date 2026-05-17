'use client';

import React, { useState, useCallback } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { SITE_NAME } from '@/lib/constants';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayButtonProps {
  amount: number;
  orderId: string;
  razorpayOrderId: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure: (error: any) => void;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  disabled?: boolean;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayButton({
  amount,
  orderId,
  razorpayOrderId,
  onSuccess,
  onFailure,
  customerName,
  customerEmail,
  customerPhone,
  disabled = false,
}: RazorpayButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = useCallback(async () => {
    setIsProcessing(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      onFailure(new Error('Failed to load payment gateway. Please check your internet connection.'));
      setIsProcessing(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: 'INR',
      name: SITE_NAME,
      description: `Order #${orderId}`,
      order_id: razorpayOrderId,
      prefill: {
        name: customerName || '',
        email: customerEmail || '',
        contact: customerPhone || '',
      },
      theme: {
        color: '#722F37',
        backdrop_color: 'rgba(0, 0, 0, 0.5)',
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
        },
        confirm_close: true,
        escape: false,
      },
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        setIsProcessing(false);
        onSuccess(response);
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        setIsProcessing(false);
        onFailure(response.error);
      });
      razorpay.open();
    } catch (error) {
      setIsProcessing(false);
      onFailure(error);
    }
  }, [amount, orderId, razorpayOrderId, customerName, customerEmail, customerPhone, onSuccess, onFailure]);

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isProcessing}
      className="w-full h-12 text-base font-semibold bg-[#722F37] hover:bg-[#5e262d]"
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-5 w-5" />
          Pay {formatCurrency(amount)}
        </>
      )}
    </Button>
  );
}
