'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authApi } from '@/lib/apiService';

interface AuthNavProps {
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function AuthNav({ user }: AuthNavProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">
          Welcome, {user.name}
        </span>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Link 
        href="/auth/login" 
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        Log in
      </Link>
      <Link 
        href="/auth/register" 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Sign up
      </Link>
    </div>
  );
}

