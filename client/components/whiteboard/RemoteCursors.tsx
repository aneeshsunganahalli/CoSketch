'use client';

import React, { useState, useEffect } from 'react';
import { CursorMoveEvent } from '@/types/socket.types';

interface RemoteCursor {
  userId: string;
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
      case 'marker':
        return '✏️';
      case 'eraser':
        return '🧽';
      case 'text':
        return '📝';
      case 'select':
        return '👆';
      default:
        return '👆';
    }
  };

  const getCursorColor = (color?: string, userId?: string) => {
    if (color) return color;
    
    // Generate a consistent color based on userId
    if (!userId) return '#3B82F6';
    
    const colors = [
      '#EF4444', '#F97316', '#EAB308', '#22C55E', 
      '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
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
      {visibleCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Cursor dot */}
          <div
            className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
            style={{
              backgroundColor: getCursorColor(cursor.color, cursor.userId),
            }}
          />
          
          {/* Cursor label */}
          <div className="absolute top-4 left-0 px-2 py-1 text-xs text-white rounded-md shadow-lg whitespace-nowrap"
            style={{
              backgroundColor: getCursorColor(cursor.color, cursor.userId),
            }}
          >
            <div className="flex items-center space-x-1">
              <span>{getCursorIcon(cursor.tool)}</span>
              <span>User {cursor.userId.slice(0, 6)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RemoteCursors;
