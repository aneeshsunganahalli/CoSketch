export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Room {
  roomId: string;
  createdBy?: string;
  creatorName: string;
  isGuestRoom: boolean;
  createdAt: string;
  participantCount?: number;
  settings?: {
    isPublic: boolean;
    maxParticipants: number;
    allowGuests: boolean;
  };
}

export interface Participant {
  id: string;
  name: string;
  isGuest: boolean;
  joinedAt: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  user?: User;
  room?: Room;
  participant?: Participant;
}
