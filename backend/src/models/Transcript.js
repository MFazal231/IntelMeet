import mongoose from 'mongoose';

const TranscriptSchema = new mongoose.Schema({
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  title: { type: String, default: 'Meeting transcript' },
  text: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
}, { timestamps: true });

export default mongoose.models.Transcript || mongoose.model('Transcript', TranscriptSchema);
