import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface RoomResponse {
  success: boolean;
  message?: string;
  room?: {
    roomId: string;
    createdBy?: string;
    creatorName: string;
    isGuestRoom: boolean;
    createdAt: Date;
    participantCount?: number;
    settings?: {
      isPublic: boolean;
      maxParticipants: number;
      allowGuests: boolean;
    };
  };
  participant?: {
    id: string;
    name: string;
    isGuest: boolean;
    joinedAt: Date;
  };
}
