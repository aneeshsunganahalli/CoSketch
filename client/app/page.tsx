'use client';

import { useState } from "react";

export default function Home() {
  const [roomId, setRoomId] = useState("");

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    window.location.href = `/room/${newRoomId}`;
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      window.location.href = `/room/${roomId.trim()}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CoSketch</h1>
          <p className="text-gray-600">Collaborative whiteboard like Miro</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={createRoom}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Create New Room
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            />
            <button
              onClick={joinRoom}
              disabled={!roomId.trim()}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Join Room
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Start collaborating on your ideas with an infinite canvas
          </p>
        </div>
      </div>
    </div>
  );
}
