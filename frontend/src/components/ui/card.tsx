import React from 'react';
import { cn } from '@/lib/utils';

/* ---------- Card root ---------- */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md',
        className
      )}
      {...props}
    />
  );
}

/* ---------- Card Header ---------- */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('border-b border-gray-100 px-6 py-4', className)}
      {...props}
    />
  );
}

/* ---------- Card Body ---------- */
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardBody({ className, ...props }: CardBodyProps) {
  return <div className={cn('px-6 py-4', className)} {...props} />;
}

/* ---------- Card Footer ---------- */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('border-t border-gray-100 px-6 py-4', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardBody, CardFooter };
