import React from 'react';

export function Alert({ variant = 'default', children }: { variant?: string; children: React.ReactNode }) {
  const base = 'p-2 rounded flex items-start gap-2';
  const variantClass = variant === 'destructive' ? 'bg-red-50 text-red-800' : 'bg-gray-100 text-gray-800';
  return <div className={`${base} ${variantClass}`}>{children}</div>;
}

export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>;
}

export default Alert;
