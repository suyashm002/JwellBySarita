'use client';

import React from 'react';

const promoMessages = [
  'Free Shipping Above \u20B92,000',
  'BIS Hallmarked Silver',
  'Certified Gemstones',
  '7-Day Easy Returns',
  'Insured Shipping',
];

export default function SilverRateTicker() {
  const tickerContent = (
    <span className="inline-flex items-center gap-6 px-4">
      {promoMessages.map((msg, idx) => (
        <span key={idx} className="flex items-center gap-6">
          <span className="font-medium text-white">{msg}</span>
          {idx < promoMessages.length - 1 && (
            <span className="text-gray-600">|</span>
          )}
        </span>
      ))}
    </span>
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#2D1F22] to-[#3D2A2E] py-2.5">
      <div className="animate-ticker flex whitespace-nowrap text-sm">
        {tickerContent}
        {tickerContent}
        {tickerContent}
        {tickerContent}
      </div>
    </div>
  );
}
