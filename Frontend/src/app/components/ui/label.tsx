import React from 'react';

export function Label({ htmlFor, children, className = '' }: { htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`block text-sm font-medium ${className}`}
      style={{ color: '#374151' }}
    >
      {children}
    </label>
  );
}

