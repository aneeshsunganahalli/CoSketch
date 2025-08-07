import mongoose, { Schema, Document, Model } from 'mongoose';

// NOTE: This room model is no longer used for active room storage.
// Rooms are now handled in-memory via socket connections.
// This model is kept for potential future use or migration purposes.

export interface IParticipant {
  id: string;
  name: string;
  isGuest: boolean;
  joinedAt: Date;
}

export interface IRoomSettings {
  isPublic: boolean;
  maxParticipants: number;
  allowGuests: boolean;
}

export interface IRoom extends Document {
  roomId: string;
  name?: string;
  createdBy?: mongoose.Types.ObjectId; // User ID if authenticated user created it
  creatorName: string; // Display name of creator (for both auth and guest)
  isGuestRoom: boolean; // True if created by a guest
  participants: IParticipant[];
  settings: IRoomSettings;
  canvasData?: string;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  isGuest: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now }
});

const RoomSettingsSchema = new Schema<IRoomSettings>({
  isPublic: { type: Boolean, default: true },
  maxParticipants: { type: Number, default: 50 },
  allowGuests: { type: Boolean, default: true }
});

const RoomSchema: Schema = new Schema<IRoom>({
  roomId: { type: String, required: true, unique: true },
  name: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creatorName: { type: String, required: true },
  isGuestRoom: { type: Boolean, default: false },
  participants: [ParticipantSchema],
  settings: { type: RoomSettingsSchema, default: () => ({}) },
  canvasData: { type: String },
  lastActivity: { type: Date, default: Date.now },
}, { timestamps: true });

const roomModel: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default roomModel;