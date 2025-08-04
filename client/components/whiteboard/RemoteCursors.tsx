'use client';

import React, { useState, useEffect } from 'react';
import { CursorMoveEvent } from '@/types/socket.types';

interface RemoteCursor {
  userId: string;
  userName?: string;
  x: number;
  y: number;
  color?: string;
  size?: number;
  tool?: string;
  lastSeen: number;
}

interface RemoteCursorsProps {
  cursors: Map<string, RemoteCursor>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const RemoteCursors: React.FC<RemoteCursorsProps> = ({ cursors, containerRef }) => {
  const [visibleCursors, setVisibleCursors] = useState<RemoteCursor[]>([]);

  useEffect(() => {
    const updateVisibleCursors = () => {
      const now = Date.now();
      const activeCursors = Array.from(cursors.values()).filter(
        cursor => now - cursor.lastSeen < 5000 // Hide cursors after 5 seconds
      );
      setVisibleCursors(activeCursors);
    };

    updateVisibleCursors();
    
    // Clean up old cursors every second
    const interval = setInterval(updateVisibleCursors, 1000);
    
    return () => clearInterval(interval);
  }, [cursors]);

  const getCursorIcon = (tool?: string) => {
    switch (tool) {
      case 'pen':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        );
      case 'marker':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3 2h6v3H7V4zm8 5v6H5V9h10z" clipRule="evenodd"/>
          </svg>
        );
      case 'eraser':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd"/>
          </svg>
        );
      case 'text':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd"/>
          </svg>
        );
    }
  };

  const getCursorColor = (color?: string, userId?: string) => {
    if (color) return color;
    
    // Generate a consistent color based on userId with modern, appealing colors
    if (!userId) return '#6366F1';
    
    const colors = [
      '#EF4444', // Red
      '#F97316', // Orange  
      '#EAB308', // Yellow
      '#22C55E', // Green
      '#06B6D4', // Cyan
      '#6366F1', // Indigo
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#10B981', // Emerald
    ];
    
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (!containerRef.current || visibleCursors.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {visibleCursors.map((cursor) => {
        const cursorColor = getCursorColor(cursor.color, cursor.userId);
        const isRecentlyActive = Date.now() - cursor.lastSeen < 1000;
        
        return (
          <div
            key={cursor.userId}
            className={`absolute transition-all duration-200 ease-out ${
              isRecentlyActive ? 'scale-110' : 'scale-100'
            }`}
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-6px, -6px)', // Adjust for better positioning
            }}
          >
            {/* Main cursor dot with subtle shadow and glow */}
            <div className="relative">
              <div
                className={`w-3 h-3 rounded-full border border-white/80 shadow-lg transition-all duration-200 ${
                  isRecentlyActive ? 'shadow-xl' : 'shadow-md'
                }`}
                style={{
                  backgroundColor: cursorColor,
                  boxShadow: `0 0 ${isRecentlyActive ? '12px' : '6px'} ${cursorColor}20, 0 2px 8px rgba(0,0,0,0.15)`,
                }}
              />
              
              {/* Subtle pulse ring for active cursors */}
              {isRecentlyActive && (
                <div
                  className="absolute inset-0 w-3 h-3 rounded-full border-2 opacity-40 animate-ping"
                  style={{
                    borderColor: cursorColor,
                  }}
                />
              )}
            </div>

            {/* Minimalist label that appears on hover/activity */}
            <div 
              className={`absolute top-5 left-0 transition-all duration-300 ${
                isRecentlyActive ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-1'
              }`}
            >
              <div 
                className="px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg backdrop-blur-sm border border-white/20"
                style={{
                  backgroundColor: `${cursorColor}E6`, // 90% opacity
                }}
              >
                <div className="flex items-center space-x-1.5">
                  <div className="text-white/90">
                    {getCursorIcon(cursor.tool)}
                  </div>
                  <span className="text-white/95 font-mono text-xs">
                    {cursor.userName || `User_${cursor.userId.slice(0, 4)}`}
                  </span>
                </div>
                
                {/* Small arrow pointing to cursor */}
                <div 
                  className="absolute -top-1 left-2 w-2 h-2 rotate-45"
                  style={{
                    backgroundColor: `${cursorColor}E6`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RemoteCursors;
