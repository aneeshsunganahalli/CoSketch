'use client';

// Utility for persisting room state in localStorage
const STORAGE_PREFIX = 'cosketch_';
const WHITEBOARD_KEY = (roomId: string) => `${STORAGE_PREFIX}whiteboard_${roomId}`;
const CODE_KEY = (roomId: string) => `${STORAGE_PREFIX}code_${roomId}`;
const USER_PREFS_KEY = `${STORAGE_PREFIX}user_prefs`;

export interface PersistedWhiteboardState {
  canvasState?: string;
  boardData?: any[];
  timestamp: number;
}

export interface PersistedCodeState {
  content?: string;
  language?: string;
  timestamp: number;
}

export interface UserPreferences {
  userName?: string;
  isAuthenticated?: boolean;
  lastRoomId?: string;
}

class RoomPersistence {
  private static instance: RoomPersistence;

  static getInstance(): RoomPersistence {
    if (!RoomPersistence.instance) {
      RoomPersistence.instance = new RoomPersistence();
    }
    return RoomPersistence.instance;
  }

  // Whiteboard persistence
  saveWhiteboardState(roomId: string, state: PersistedWhiteboardState): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(WHITEBOARD_KEY(roomId), JSON.stringify({
        ...state,
        timestamp: Date.now()
      }));
      console.log('💾 Saved whiteboard state to localStorage');
    } catch (error) {
      console.warn('Failed to save whiteboard state:', error);
    }
  }

  getWhiteboardState(roomId: string): PersistedWhiteboardState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(WHITEBOARD_KEY(roomId));
      if (!stored) return null;
      
      const state = JSON.parse(stored);
      
      // Check if state is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - state.timestamp > maxAge) {
        this.clearWhiteboardState(roomId);
        return null;
      }
      
      return state;
    } catch (error) {
      console.warn('Failed to load whiteboard state:', error);
      return null;
    }
  }

  clearWhiteboardState(roomId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(WHITEBOARD_KEY(roomId));
  }

  // Code editor persistence
  saveCodeState(roomId: string, state: PersistedCodeState): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CODE_KEY(roomId), JSON.stringify({
        ...state,
        timestamp: Date.now()
      }));
      console.log('💾 Saved code state to localStorage');
    } catch (error) {
      console.warn('Failed to save code state:', error);
    }
  }

  getCodeState(roomId: string): PersistedCodeState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(CODE_KEY(roomId));
      if (!stored) return null;
      
      const state = JSON.parse(stored);
      
      // Check if state is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - state.timestamp > maxAge) {
        this.clearCodeState(roomId);
        return null;
      }
      
      return state;
    } catch (error) {
      console.warn('Failed to load code state:', error);
      return null;
    }
  }

  clearCodeState(roomId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CODE_KEY(roomId));
  }

  // User preferences
  saveUserPreferences(prefs: UserPreferences): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  getUserPreferences(): UserPreferences | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(USER_PREFS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
      return null;
    }
  }

  // Cleanup old data
  cleanup(): void {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            if (data.timestamp && (now - data.timestamp) > maxAge) {
              localStorage.removeItem(key);
              console.log('🧹 Cleaned up old data:', key);
            }
          }
        } catch (error) {
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      }
    }
  }
}

export const roomPersistence = RoomPersistence.getInstance();
