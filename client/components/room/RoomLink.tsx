'use client';

import { useState } from 'react';

interface RoomLinkProps {
  roomId: string;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
}

export default function RoomLink({ roomId, className = '', variant = 'primary', size = 'md' }: RoomLinkProps) {
  const [copied, setCopied] = useState(false);

  const getRoomUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/room/${roomId}`;
    }
    return '';
  };

  const copyRoomLink = async () => {
    try {
      const roomUrl = getRoomUrl();
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const baseClasses = "inline-flex items-center space-x-2 rounded-lg transition-colors font-medium";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-sm"
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      onClick={copyRoomLink}
      className={buttonClasses}
      title="Copy room link to clipboard"
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        {copied ? (
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 13l4 4L19 7" 
          />
        ) : (
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
          />
        )}
      </svg>
      <span>{copied ? 'Copied!' : 'Share Room'}</span>
    </button>
  );
}
