'use client';

import React, { useState } from 'react';
import {
  Settings,
  Store,
  CreditCard,
  Truck,
  Receipt,
  Bell,
  Save,
} from 'lucide-react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import toast from 'react-hot-toast';

interface GeneralSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  supportEmail: string;
}

interface PaymentSettings {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  enableCOD: boolean;
}

interface ShippingSettings {
  freeShippingThreshold: number;
  flatShippingRate: number;
  enableInsurance: boolean;
  insuranceRate: number;
  shippingZones: string;
}

interface TaxSettings {
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  hsnCode: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  orderConfirmation: boolean;
  orderShipped: boolean;
  orderDelivered: boolean;
  abandonedCartEmail: boolean;
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  onSave,
  saving,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#722F37]/10 p-2">
            <Icon className="h-5 w-5 text-[#722F37]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">{children}</CardBody>
      <CardFooter className="flex justify-end">
        <Button onClick={onSave} loading={saving}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SettingsPage() {
  const [saving, setSaving] = useState<string | null>(null);

  // General
  const [general, setGeneral] = useState<GeneralSettings>({
    storeName: 'JewelUp',
    storeEmail: 'hello@jewelup.in',
    storePhone: '+91 98765 43210',
    storeAddress: '',
    supportEmail: 'support@jewelup.in',
  });

  // Payment
  const [payment, setPayment] = useState<PaymentSettings>({
    razorpayKeyId: '',
    razorpayKeySecret: '',
    enableCOD: false,
  });

  // Shipping
  const [shipping, setShipping] = useState<ShippingSettings>({
    freeShippingThreshold: 2000,
    flatShippingRate: 99,
    enableInsurance: true,
    insuranceRate: 1.5,
    shippingZones: 'PAN India',
  });

  // Tax
  const [tax, setTax] = useState<TaxSettings>({
    gstRate: 3,
    cgstRate: 1.5,
    sgstRate: 1.5,
    igstRate: 3,
    hsnCode: '7113',
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: false,
    orderConfirmation: true,
    orderShipped: true,
    orderDelivered: true,
    abandonedCartEmail: true,
  });

  const handleSave = async (section: string) => {
    setSaving(section);
    // Simulate API call - replace with actual API when available
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.success(`${section} settings saved`);
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-[#722F37]" />
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
      </div>

      {/* General */}
      <SettingsSection
        icon={Store}
        title="General"
        description="Basic store information and contact details"
        onSave={() => handleSave('General')}
        saving={saving === 'General'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Store Name"
            value={general.storeName}
            onChange={(e) => setGeneral({ ...general, storeName: e.target.value })}
          />
          <Input
            label="Store Email"
            type="email"
            value={general.storeEmail}
            onChange={(e) => setGeneral({ ...general, storeEmail: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Store Phone"
            value={general.storePhone}
            onChange={(e) => setGeneral({ ...general, storePhone: e.target.value })}
          />
          <Input
            label="Support Email"
            type="email"
            value={general.supportEmail}
            onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Store Address</label>
          <textarea
            value={general.storeAddress}
            onChange={(e) => setGeneral({ ...general, storeAddress: e.target.value })}
            rows={3}
            placeholder="Full store address..."
            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20"
          />
        </div>
      </SettingsSection>

      {/* Payment */}
      <SettingsSection
        icon={CreditCard}
        title="Payment"
        description="Payment gateway configuration"
        onSave={() => handleSave('Payment')}
        saving={saving === 'Payment'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Razorpay Key ID"
            value={payment.razorpayKeyId}
            onChange={(e) => setPayment({ ...payment, razorpayKeyId: e.target.value })}
            placeholder="rzp_live_..."
          />
          <Input
            label="Razorpay Key Secret"
            type="password"
            value={payment.razorpayKeySecret}
            onChange={(e) => setPayment({ ...payment, razorpayKeySecret: e.target.value })}
            placeholder="Enter secret key"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={payment.enableCOD}
            onChange={(e) => setPayment({ ...payment, enableCOD: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-[#722F37] focus:ring-[#B76E79]"
          />
          Enable Cash on Delivery (COD)
        </label>
      </SettingsSection>

      {/* Shipping */}
      <SettingsSection
        icon={Truck}
        title="Shipping"
        description="Shipping rates, free shipping threshold, and zones"
        onSave={() => handleSave('Shipping')}
        saving={saving === 'Shipping'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Free Shipping Threshold (INR)"
            type="number"
            value={shipping.freeShippingThreshold}
            onChange={(e) =>
              setShipping({ ...shipping, freeShippingThreshold: Number(e.target.value) })
            }
          />
          <Input
            label="Flat Shipping Rate (INR)"
            type="number"
            value={shipping.flatShippingRate}
            onChange={(e) =>
              setShipping({ ...shipping, flatShippingRate: Number(e.target.value) })
            }
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={shipping.enableInsurance}
                onChange={(e) =>
                  setShipping({ ...shipping, enableInsurance: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-[#722F37] focus:ring-[#B76E79]"
              />
              Enable Shipping Insurance
            </label>
          </div>
          {shipping.enableInsurance && (
            <Input
              label="Insurance Rate (%)"
              type="number"
              step="0.1"
              value={shipping.insuranceRate}
              onChange={(e) =>
                setShipping({ ...shipping, insuranceRate: Number(e.target.value) })
              }
            />
          )}
        </div>
        <Input
          label="Shipping Zones"
          value={shipping.shippingZones}
          onChange={(e) => setShipping({ ...shipping, shippingZones: e.target.value })}
          placeholder="e.g. PAN India, Metro Cities Only"
        />
      </SettingsSection>

      {/* Tax */}
      <SettingsSection
        icon={Receipt}
        title="Tax (GST)"
        description="GST rates and HSN codes for silver jewellery"
        onSave={() => handleSave('Tax')}
        saving={saving === 'Tax'}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="GST Rate (%)"
            type="number"
            step="0.1"
            value={tax.gstRate}
            onChange={(e) => setTax({ ...tax, gstRate: Number(e.target.value) })}
          />
          <Input
            label="CGST Rate (%)"
            type="number"
            step="0.1"
            value={tax.cgstRate}
            onChange={(e) => setTax({ ...tax, cgstRate: Number(e.target.value) })}
          />
          <Input
            label="SGST Rate (%)"
            type="number"
            step="0.1"
            value={tax.sgstRate}
            onChange={(e) => setTax({ ...tax, sgstRate: Number(e.target.value) })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="IGST Rate (%)"
            type="number"
            step="0.1"
            value={tax.igstRate}
            onChange={(e) => setTax({ ...tax, igstRate: Number(e.target.value) })}
          />
          <Input
            label="HSN Code"
            value={tax.hsnCode}
            onChange={(e) => setTax({ ...tax, hsnCode: e.target.value })}
            placeholder="7113"
          />
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        icon={Bell}
        title="Notifications"
        description="Configure email, SMS, and WhatsApp notification preferences"
        onSave={() => handleSave('Notifications')}
        saving={saving === 'Notifications'}
      >
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Channels</h4>
          <div className="flex flex-wrap gap-6">
            {[
              { key: 'emailEnabled' as const, label: 'Email' },
              { key: 'smsEnabled' as const, label: 'SMS' },
              { key: 'whatsappEnabled' as const, label: 'WhatsApp' },
            ].map((ch) => (
              <label key={ch.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={notifications[ch.key]}
                  onChange={(e) =>
                    setNotifications({ ...notifications, [ch.key]: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#722F37] focus:ring-[#B76E79]"
                />
                {ch.label}
              </label>
            ))}
          </div>

          <h4 className="pt-2 text-sm font-semibold text-gray-700">Triggers</h4>
          <div className="space-y-3">
            {[
              { key: 'orderConfirmation' as const, label: 'Order Confirmation' },
              { key: 'orderShipped' as const, label: 'Order Shipped' },
              { key: 'orderDelivered' as const, label: 'Order Delivered' },
              { key: 'abandonedCartEmail' as const, label: 'Abandoned Cart Recovery' },
            ].map((trigger) => (
              <label key={trigger.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={notifications[trigger.key]}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      [trigger.key]: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#722F37] focus:ring-[#B76E79]"
                />
                {trigger.label}
              </label>
            ))}
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
