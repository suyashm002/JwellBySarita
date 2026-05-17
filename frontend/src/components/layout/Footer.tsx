'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Gem,
  Lock,
  Truck,
  RotateCcw,
  CreditCard,
  Send,
} from 'lucide-react';

const trustBadges = [
  { icon: ShieldCheck, label: 'BIS Hallmark' },
  { icon: Gem, label: 'Certified Gemstones' },
  { icon: Lock, label: 'Secure Payments' },
  { icon: Truck, label: 'Insured Shipping' },
  { icon: RotateCcw, label: '7-Day Returns' },
];

const quickLinks = [
  { label: 'Rings', href: '/category/rings' },
  { label: 'Earrings', href: '/category/earrings' },
  { label: 'Pendants', href: '/category/pendants' },
  { label: 'Bracelets', href: '/category/bracelets' },
  { label: 'New Arrivals', href: '/catalogue?isNewArrival=true' },
  { label: 'Bestsellers', href: '/catalogue?bestseller=true' },
];

const customerService = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Shipping Policy', href: '/shipping-policy' },
  { label: 'Return & Refund', href: '/return-policy' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Track Order', href: '/track-order' },
];

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/jewelupbysarita', label: 'Instagram' },
  { icon: Facebook, href: 'https://facebook.com/jewelupbysarita', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/jewelupbysarita', label: 'Twitter' },
  { icon: Youtube, href: 'https://youtube.com/@jewelupbysarita', label: 'YouTube' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-[#2D1F22] text-gray-300">
      {/* Trust Badges */}
      <div className="border-b border-white/10">
        <div className="container-wide py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-2 text-center"
              >
                <badge.icon className="h-7 w-7 text-[#D4AF37]" />
                <span className="text-xs font-medium text-gray-400">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="font-heading text-xl font-bold text-white">
              Jewelup <span className="text-[#B76E79]">by Sarita</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Handcrafted premium silver and gemstone jewellery from the heart of
              Jaipur. Each piece tells a story of tradition, artistry, and
              elegance.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition-all hover:border-[#D4AF37] hover:text-[#D4AF37]"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-[#D4AF37]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Customer Service
            </h4>
            <ul className="space-y-2.5">
              {customerService.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-[#D4AF37]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#B76E79]" />
                <span>Johari Bazaar, Jaipur, Rajasthan 302003, India</span>
              </li>
              <li>
                <a href="tel:+919876543210" className="flex items-center gap-2.5 hover:text-[#D4AF37] transition-colors">
                  <Phone className="h-4 w-4 flex-shrink-0 text-[#B76E79]" />
                  +91 98765 43210
                </a>
              </li>
              <li>
                <a href="mailto:hello@jewelup.in" className="flex items-center gap-2.5 hover:text-[#D4AF37] transition-colors">
                  <Mail className="h-4 w-4 flex-shrink-0 text-[#B76E79]" />
                  hello@jewelup.in
                </a>
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white">
                Newsletter
              </h5>
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="w-full rounded-l-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#B76E79] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-r-lg bg-[#B76E79] px-3 text-white transition-colors hover:bg-[#A25A64]"
                  aria-label="Subscribe"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {subscribed && (
                <p className="mt-2 text-xs text-green-400">
                  Thank you for subscribing!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-wide flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Jewelup by Sarita. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {/* Payment method icons represented as text badges */}
            {['Visa', 'Mastercard', 'UPI', 'RuPay', 'Net Banking'].map(
              (method) => (
                <span
                  key={method}
                  className="rounded border border-white/10 px-2 py-0.5 text-[10px] font-medium text-gray-500"
                >
                  {method}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
