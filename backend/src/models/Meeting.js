import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  roomId: { type: String, required: true, unique: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
  startAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  timezone: { type: String, default: 'UTC' },
  status: { type: String, enum: ['scheduled', 'live', 'completed', 'cancelled'], default: 'scheduled' },
  meetingCode: { type: String, required: true },
  inviteLink: { type: String, default: '' },
  summary: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
