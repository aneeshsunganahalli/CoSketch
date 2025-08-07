import { Response } from 'express';
import { AuthenticatedRequest } from '../types/room.types';

// Generate a readable room ID
const generateRoomId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 3; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
};

// Create a new room (generate room ID only, no database storage)
const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Simply generate a unique room ID without checking database
    const roomId = generateRoomId();

    // Get user info from request (could be authenticated user or guest)
    const user = req.user; // This will be set by auth middleware if user is logged in
    const { guestName } = req.body;

    // Ensure we always have a creator name
    let creatorName: string;
    if (user) {
      creatorName = user.name;
    } else {
      creatorName = guestName || 'Guest';
    }

    // Return room info without saving to database
    res.status(201).json({
      success: true,
      room: {
        roomId: roomId,
        createdBy: user ? user.id : null,
        creatorName: creatorName,
        isGuestRoom: !user,
        createdAt: new Date()
      }
    });

  } catch (error: any) {
    console.error('Room creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while creating the room. Please try again." 
    });
  }
};

// Get room info (rooms are now created dynamically, so any room ID is valid)
const getRoomInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      res.status(400).json({ 
        success: false, 
        message: "Room ID is required" 
      });
      return;
    }

    // Since rooms are now created dynamically when users join,
    // any room ID is potentially valid
    res.status(200).json({
      success: true,
      room: {
        roomId: roomId.toUpperCase(),
        creatorName: 'Unknown', // We don't track creators anymore
        isGuestRoom: true, // All rooms are essentially guest rooms now
        createdAt: new Date(), // Current time
        participantCount: 0, // We don't track this in database anymore
        settings: {
          isPublic: true,
          maxParticipants: 50,
          allowGuests: true
        }
      }
    });

  } catch (error: any) {
    console.error('Get room info error:', error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while fetching room information." 
    });
  }
};

// Join a room (rooms are now handled in-memory via sockets)
const joinRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { guestName } = req.body;
    const user = req.user;

    if (!roomId) {
      res.status(400).json({ 
        success: false, 
        message: "Room ID is required" 
      });
      return;
    }

    // Since rooms are handled in-memory, any room can be joined
    // Prepare participant data for response
    const participantData = {
      id: user ? user.id : `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: user ? user.name : (guestName || 'Guest'),
      isGuest: !user,
      joinedAt: new Date()
    };

    res.status(200).json({
      success: true,
      participant: participantData,
      room: {
        roomId: roomId.toUpperCase(),
        participantCount: 1 // We don't track this accurately in REST API anymore
      }
    });

  } catch (error: any) {
    console.error('Join room error:', error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while joining the room." 
    });
  }
};

// Leave a room (rooms are now handled in-memory via sockets)
const leaveRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { participantId } = req.body;

    if (!roomId || !participantId) {
      res.status(400).json({ 
        success: false, 
        message: "Room ID and participant ID are required" 
      });
      return;
    }

    // Since rooms are handled in-memory, we just return success
    // The actual leaving logic is handled by socket disconnection
    res.status(200).json({
      success: true,
      message: "Left room successfully",
      participantCount: 0 // We don't track this accurately in REST API anymore
    });

  } catch (error: any) {
    console.error('Leave room error:', error);
    res.status(500).json({ 
      success: false, 
      message: "An error occurred while leaving the room." 
    });
  }
};

export { createRoom, getRoomInfo, joinRoom, leaveRoom };
