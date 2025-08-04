import express from 'express';
import { createRoom, getRoomInfo, joinRoom, leaveRoom } from '../controllers/roomController';
import optionalAuth from '../middleware/optionalAuth'

const roomRouter = express.Router();

// Create a new room (authenticated users or guests)
roomRouter.post('/create', optionalAuth, createRoom);

// Get room information
roomRouter.get('/:roomId', optionalAuth, getRoomInfo);

// Join a room
roomRouter.post('/:roomId/join', optionalAuth, joinRoom);

// Leave a room
roomRouter.post('/:roomId/leave', optionalAuth, leaveRoom);

export default roomRouter;
