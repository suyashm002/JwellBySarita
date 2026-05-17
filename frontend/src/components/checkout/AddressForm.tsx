'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { shippingAPI } from '@/lib/api';
import { Address } from '@/types/user';

const INDIAN_STATES = [
  { value: 'AN', label: 'Andaman and Nicobar Islands' },
  { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'AR', label: 'Arunachal Pradesh' },
  { value: 'AS', label: 'Assam' },
  { value: 'BR', label: 'Bihar' },
  { value: 'CH', label: 'Chandigarh' },
  { value: 'CT', label: 'Chhattisgarh' },
  { value: 'DL', label: 'Delhi' },
  { value: 'GA', label: 'Goa' },
  { value: 'GJ', label: 'Gujarat' },
  { value: 'HR', label: 'Haryana' },
  { value: 'HP', label: 'Himachal Pradesh' },
  { value: 'JK', label: 'Jammu and Kashmir' },
  { value: 'JH', label: 'Jharkhand' },
  { value: 'KA', label: 'Karnataka' },
  { value: 'KL', label: 'Kerala' },
  { value: 'LA', label: 'Ladakh' },
  { value: 'MP', label: 'Madhya Pradesh' },
  { value: 'MH', label: 'Maharashtra' },
  { value: 'MN', label: 'Manipur' },
  { value: 'ML', label: 'Meghalaya' },
  { value: 'MZ', label: 'Mizoram' },
  { value: 'NL', label: 'Nagaland' },
  { value: 'OR', label: 'Odisha' },
  { value: 'PB', label: 'Punjab' },
  { value: 'PY', label: 'Puducherry' },
  { value: 'RJ', label: 'Rajasthan' },
  { value: 'SK', label: 'Sikkim' },
  { value: 'TN', label: 'Tamil Nadu' },
  { value: 'TG', label: 'Telangana' },
  { value: 'TR', label: 'Tripura' },
  { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'UK', label: 'Uttarakhand' },
  { value: 'WB', label: 'West Bengal' },
];

const LABEL_OPTIONS = [
  { value: 'Home', label: 'Home' },
  { value: 'Office', label: 'Office' },
  { value: 'Other', label: 'Other' },
];

const addressSchema = z.object({
  label: z.string().min(1, 'Select an address type'),
  name: z.string().min(2, 'Full name is required'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  line1: z.string().min(5, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(1, 'Select a state'),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  onSubmit: (data: AddressFormValues) => void;
  defaultValues?: Partial<Address>;
  isLoading?: boolean;
}

export function AddressForm({ onSubmit, defaultValues, isLoading }: AddressFormProps) {
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'serviceable' | 'not-serviceable'>('idle');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: defaultValues?.label || 'Home',
      name: defaultValues?.name || '',
      phone: defaultValues?.phone || '',
      line1: defaultValues?.line1 || '',
      line2: defaultValues?.line2 || '',
      city: defaultValues?.city || '',
      state: defaultValues?.state || '',
      pincode: defaultValues?.pincode || '',
      isDefault: defaultValues?.isDefault || false,
    },
  });

  const handlePincodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const pincode = e.target.value;
    if (!/^\d{6}$/.test(pincode)) return;

    setPincodeStatus('checking');
    try {
      const { data } = await shippingAPI.checkServiceability(pincode);
      const info = data.data;
      if (info?.serviceable) {
        setPincodeStatus('serviceable');
        if (info.city) setValue('city', info.city);
        if (info.state) setValue('state', info.state);
      } else {
        setPincodeStatus('not-serviceable');
      }
    } catch {
      setPincodeStatus('idle');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Address label */}
      <Select
        label="Address Type"
        options={LABEL_OPTIONS}
        error={errors.label?.message}
        {...register('label')}
      />

      {/* Name and phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          placeholder="Enter full name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Phone Number"
          placeholder="10-digit mobile number"
          maxLength={10}
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      {/* Address lines */}
      <Input
        label="Address Line 1"
        placeholder="House no., building, street"
        error={errors.line1?.message}
        {...register('line1')}
      />
      <Input
        label="Address Line 2 (Optional)"
        placeholder="Landmark, area"
        error={errors.line2?.message}
        {...register('line2')}
      />

      {/* Pincode, City, State */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Input
            label="Pincode"
            placeholder="6-digit pincode"
            maxLength={6}
            error={errors.pincode?.message}
            {...register('pincode')}
            onBlur={handlePincodeBlur}
          />
          {pincodeStatus === 'checking' && (
            <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-[#B76E79]" />
          )}
          {pincodeStatus === 'serviceable' && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-600">Delivery available</span>
            </div>
          )}
          {pincodeStatus === 'not-serviceable' && (
            <p className="text-xs text-red-500 mt-1">Delivery not available to this pincode</p>
          )}
        </div>
        <Input
          label="City"
          placeholder="City"
          error={errors.city?.message}
          {...register('city')}
        />
        <Select
          label="State"
          options={INDIAN_STATES}
          placeholder="Select state"
          error={errors.state?.message}
          {...register('state')}
        />
      </div>

      {/* Default address */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register('isDefault')}
          className="h-4 w-4 rounded border-gray-300 text-[#722F37] focus:ring-[#B76E79]"
        />
        <span className="text-sm text-gray-700">Save as default address</span>
      </label>

      <Button type="submit" className="w-full" loading={isLoading}>
        Save Address
      </Button>
    </form>
  );
}
