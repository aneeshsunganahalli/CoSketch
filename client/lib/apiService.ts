import { ApiResponse, LoginData, RegisterData } from '@/types/api.types';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
});


export const authApi = {
  // Register user
  register: async (userData: RegisterData): Promise<ApiResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginData): Promise<ApiResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Verify authentication status
  verify: async (): Promise<ApiResponse> => {
    const response = await api.get('/auth/verify');
    return response.data;
  }
};

export const roomApi = {
  // Create a new room
  createRoom: async (guestName?: string): Promise<ApiResponse> => {
    const body = guestName ? { guestName } : {};
    const response = await api.post('/api/rooms/create', body);
    return response.data;
  },

  // Get room information
  getRoomInfo: async (roomId: string): Promise<ApiResponse> => {
    const response = await api.get(`/api/rooms/${roomId}`);
    return response.data;
  },

  // Join a room
  joinRoom: async (roomId: string, guestName?: string): Promise<ApiResponse> => {
    const body = guestName ? { guestName } : {};
    const response = await api.post(`/api/rooms/${roomId}/join`, body);
    return response.data;
  },

  // Leave a room
  leaveRoom: async (roomId: string, participantId: string): Promise<ApiResponse> => {
    const response = await api.post(`/api/rooms/${roomId}/leave`, { participantId });
    return response.data;
  }
};

export const profileApi = {
  // Get user profile
  getProfile: async (): Promise<ApiResponse> => {
    const response = await api.get('/api/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: {
    name: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<ApiResponse> => {
    const response = await api.put('/api/profile', profileData);
    return response.data;
  },

  // Change password only
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse> => {
    const response = await api.put('/api/profile/password', passwordData);
    return response.data;
  },

  // Delete account
  deleteAccount: async (deleteData: {
    password: string;
    confirmDeletion: string;
  }): Promise<ApiResponse> => {
    const response = await api.delete('/api/profile', { data: deleteData });
    return response.data;
  }
};
