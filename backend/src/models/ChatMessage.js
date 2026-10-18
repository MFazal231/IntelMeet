import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
