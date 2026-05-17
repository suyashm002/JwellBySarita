'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Package,
  MapPin,
  Heart,
  Pencil,
  LogOut,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useRequireAuth } from '@/hooks/useAuth';
import { userAPI } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

/* ------------------------------------------------------------------ */
/*  Profile edit schema                                               */
/* ------------------------------------------------------------------ */

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').or(z.literal('')),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid phone number')
    .or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/* ------------------------------------------------------------------ */
/*  Quick link data                                                   */
/* ------------------------------------------------------------------ */

const quickLinks = [
  {
    href: '/account/orders',
    label: 'My Orders',
    description: 'Track, return or buy again',
    icon: Package,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/account/addresses',
    label: 'My Addresses',
    description: 'Manage delivery addresses',
    icon: MapPin,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    href: '/account/wishlist',
    label: 'My Wishlist',
    description: 'Items you love',
    icon: Heart,
    color: 'bg-pink-50 text-pink-600',
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function AccountPage() {
  const { user, isLoading, setUser, logout } = useRequireAuth();
  const [editOpen, setEditOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  /* Open edit modal and prefill */
  const openEdit = () => {
    if (!user) return;
    reset({
      name: user.name,
      email: user.email ?? '',
      phone: user.phone ?? '',
    });
    setEditOpen(true);
  };

  const onSave = async (data: ProfileFormData) => {
    try {
      const { data: res } = await userAPI.updateProfile({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });
      setUser(res.data);
      toast.success('Profile updated');
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
      window.location.href = '/';
    } catch {
      toast.error('Failed to log out');
    }
  };

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton variant="card" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton variant="card" className="h-28" />
          <Skeleton variant="card" className="h-28" />
          <Skeleton variant="card" className="h-28" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-gray-900">
            My Account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user.name.split(' ')[0]}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          <Button variant="ghost" size="sm" onClick={openEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </CardHeader>
        <CardBody>
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#B76E79]/10 text-xl font-bold text-[#722F37]">
              {getInitials(user.name)}
            </div>

            {/* Details */}
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <User className="h-3.5 w-3.5" />
                  Full Name
                </p>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
              </div>

              <div className="space-y-1">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {user.email || 'Not set'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {user.phone ? `+91 ${user.phone}` : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="group cursor-pointer border-gray-100 transition-all hover:border-[#B76E79]/30 hover:shadow-md">
              <CardBody className="flex items-center gap-4">
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${link.color}`}
                >
                  <link.icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                  <p className="text-xs text-gray-500">{link.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#722F37]" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* ---- Edit profile dialog ---- */}
      <Dialog isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Input
            label="Full Name"
            icon={<User className="h-4 w-4" />}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email Address"
            type="email"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone Number"
            type="tel"
            icon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
