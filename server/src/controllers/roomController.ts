import { Response } from 'express';
import mongoose from 'mongoose';
import RoomModel, { IRoom } from '../models/room.model';
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

// Create a new room
const createRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let roomId: string;
    let roomExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate a unique room ID
    while (roomExists && attempts < maxAttempts) {
      roomId = generateRoomId();
      const existingRoom = await RoomModel.findOne({ roomId });
      if (!existingRoom) {
        roomExists = false;
      }
      attempts++;
    }

    if (roomExists) {
      res.status(500).json({ 
        success: false, 
        message: "Unable to generate unique room ID. Please try again." 
      });
      return;
    }

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

    // Create room data
    const roomData: Partial<IRoom> = {
      roomId: roomId!,
      createdBy: user ? new mongoose.Types.ObjectId(user.id) : undefined,
      creatorName: creatorName,
      isGuestRoom: !user,
      createdAt: new Date(),
      lastActivity: new Date(),
      participants: [],
      settings: {
        isPublic: true, // For now, all rooms are public (joinable via link)
        maxParticipants: 50,
        allowGuests: true
      }
    };

    const newRoom = new RoomModel(roomData);
    const savedRoom = await newRoom.save();

    res.status(201).json({
      success: true,
      room: {
        roomId: savedRoom.roomId,
        createdBy: savedRoom.createdBy,
        creatorName: savedRoom.creatorName,
        isGuestRoom: savedRoom.isGuestRoom,
        createdAt: savedRoom.createdAt
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

// Get room info
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

    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });

    if (!room) {
      res.status(404).json({ 
        success: false, 
        message: "Room not found" 
      });
      return;
    }

    // Update last activity
    room.lastActivity = new Date();
    await room.save();

    res.status(200).json({
      success: true,
      room: {
        roomId: room.roomId,
        creatorName: room.creatorName,
        isGuestRoom: room.isGuestRoom,
        createdAt: room.createdAt,
        participantCount: room.participants.length,
        settings: room.settings
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

// Join a room
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

    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });

    if (!room) {
      res.status(404).json({ 
        success: false, 
        message: "Room not found" 
      });
      return;
    }

    // Check if room allows guests (if user is not authenticated)
    if (!user && !room.settings.allowGuests) {
      res.status(403).json({ 
        success: false, 
        message: "This room requires authentication to join" 
      });
      return;
    }

    // Check max participants
    if (room.participants.length >= room.settings.maxParticipants) {
      res.status(403).json({ 
        success: false, 
        message: "Room is full" 
      });
      return;
    }

    // Prepare participant data
    const participantData = {
      id: user ? user.id : `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: user ? user.name : (guestName || 'Guest'),
      isGuest: !user,
      joinedAt: new Date()
    };

    // Add participant if not already in the room
    const existingParticipant = room.participants.find(p => p.id === participantData.id);
    if (!existingParticipant) {
      room.participants.push(participantData);
      room.lastActivity = new Date();
      await room.save();
    }

    res.status(200).json({
      success: true,
      participant: participantData,
      room: {
        roomId: room.roomId,
        participantCount: room.participants.length
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

// Leave a room
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

    const room = await RoomModel.findOne({ roomId: roomId.toUpperCase() });

    if (!room) {
      res.status(404).json({ 
        success: false, 
        message: "Room not found" 
      });
      return;
    }

    // Remove participant
    room.participants = room.participants.filter(p => p.id !== participantId);
    room.lastActivity = new Date();
    await room.save();

    res.status(200).json({
      success: true,
      message: "Left room successfully",
      participantCount: room.participants.length
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
