'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, Lock, Eye, EyeOff, Gem } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/stores/authStore';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardBody } from '@/components/ui/card';

/* ------------------------------------------------------------------ */
/*  Schemas                                                           */
/* ------------------------------------------------------------------ */

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const phoneSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type PhoneFormData = z.infer<typeof phoneSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function LoginPage() {
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const { login, setUser } = useAuthStore();

  /* --- Email form --- */
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '', password: '' },
  });

  /* --- Phone form --- */
  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  /* --- OTP form --- */
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  /* ---- handlers ---- */

  const handleEmailLogin = async (data: EmailFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      window.location.href = redirect;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid email or password');
    }
  };

  const handleRequestOtp = async (data: PhoneFormData) => {
    try {
      await authAPI.requestOtp(data.phone);
      setPhoneNumber(data.phone);
      setOtpSent(true);
      toast.success('OTP sent to your phone');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    try {
      const { data: res } = await authAPI.verifyOtp(phoneNumber, data.otp);
      setUser(res.data);
      toast.success('Welcome back!');
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      window.location.href = redirect;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardBody className="space-y-6 px-8 py-10">
          {/* Brand mark */}
          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#B76E79]/10">
              <Gem className="h-6 w-6 text-[#722F37]" />
            </span>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-gray-900">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500">Sign in to your Jewelup account</p>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => {
                setTab('email');
                setOtpSent(false);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === 'email'
                  ? 'bg-[#722F37] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setTab('phone')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === 'phone'
                  ? 'bg-[#722F37] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>
          </div>

          {/* ---- Email / Password ---- */}
          {tab === 'email' && (
            <form
              onSubmit={emailForm.handleSubmit(handleEmailLogin)}
              className="space-y-4"
            >
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" />}
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register('email')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  icon={<Lock className="h-4 w-4" />}
                  error={emailForm.formState.errors.password?.message}
                  {...emailForm.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#722F37] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={emailForm.formState.isSubmitting}
              >
                Sign In
              </Button>
            </form>
          )}

          {/* ---- Phone / OTP ---- */}
          {tab === 'phone' && !otpSent && (
            <form
              onSubmit={phoneForm.handleSubmit(handleRequestOtp)}
              className="space-y-4"
            >
              <Input
                label="Phone Number"
                type="tel"
                placeholder="9876543210"
                icon={<Phone className="h-4 w-4" />}
                error={phoneForm.formState.errors.phone?.message}
                {...phoneForm.register('phone')}
              />

              <Button
                type="submit"
                className="w-full"
                loading={phoneForm.formState.isSubmitting}
              >
                Request OTP
              </Button>
            </form>
          )}

          {tab === 'phone' && otpSent && (
            <form
              onSubmit={otpForm.handleSubmit(handleVerifyOtp)}
              className="space-y-4"
            >
              <p className="text-center text-sm text-gray-600">
                OTP sent to{' '}
                <span className="font-semibold text-gray-900">+91 {phoneNumber}</span>
              </p>

              <Input
                label="Enter OTP"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="------"
                className="text-center tracking-[0.5em]"
                error={otpForm.formState.errors.otp?.message}
                {...otpForm.register('otp')}
              />

              <Button
                type="submit"
                className="w-full"
                loading={otpForm.formState.isSubmitting}
              >
                Verify &amp; Sign In
              </Button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  otpForm.reset();
                }}
                className="w-full text-center text-xs text-[#722F37] hover:underline"
              >
                Change phone number
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400">or</span>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#722F37] hover:underline"
            >
              Create Account
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
