import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoom extends Document {
  roomId: string;
  name?: string;
  owner?: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  isPrivate: boolean;
  password?: string;
  canvasData?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema: Schema = new Schema<IRoom>({
  roomId: { type: String, required: true, unique: true },
  name: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
  password: { type: String },
  canvasData: { type: String },
}, { timestamps: true });

const roomModel: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default roomModel;