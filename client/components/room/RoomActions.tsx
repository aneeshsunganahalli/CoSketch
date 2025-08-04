'use client';

import { useState } from 'react';
import { roomApi } from '@/lib/apiService';

interface RoomActionsProps {
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  className?: string;
}

export default function RoomActions({ user, className = '' }: RoomActionsProps) {
  const [roomId, setRoomId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [recentRoomId, setRecentRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await roomApi.createRoom();
      if (result.success && result.room) {
        const newRoomId = result.room.roomId;
        setRecentRoomId(newRoomId);
        // Navigate to room immediately
        window.location.href = `/room/${newRoomId}`;
      } else {
        setError(result.message || 'Failed to create room');
      }
    } catch (err: any) {
      console.error('Room creation error:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      window.location.href = `/room/${roomId.trim().toUpperCase()}`;
    }
  };

  const handleJoinFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleJoinRoom();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Create Room Section */}
      <div className="text-center">
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200 inline-flex items-center space-x-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create New Room</span>
            </>
          )}
        </button>
        
        {!user && (
          <p className="text-sm text-gray-500 mt-2">
            Create temporary rooms without an account
          </p>
        )}
      </div>

      {/* Join Room Section */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-gray-50 text-gray-500">or</span>
        </div>
      </div>

      <div className="text-center">
        {!showJoinForm ? (
          <button
            onClick={() => setShowJoinForm(true)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Join Room</span>
          </button>
        ) : (
          <form onSubmit={handleJoinFormSubmit} className="max-w-md mx-auto">
            <div className="flex space-x-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room ID (e.g., ABC-123-XYZ)"
                className="flex-1 px-3 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={!roomId.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowJoinForm(false);
                setRoomId('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Show recent room link if just created */}
      {recentRoomId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Room Created!</p>
              <p className="text-xs text-blue-700 font-mono">{recentRoomId}</p>
            </div>
            <div className="text-sm text-blue-700">
              Redirecting to room...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
