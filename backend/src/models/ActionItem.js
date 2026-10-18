import mongoose from 'mongoose';

const ActionItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', default: null },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  dueDate: { type: Date, default: null },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['To Do', 'In Progress', 'Completed'], default: 'To Do' },
}, { timestamps: true });

export default mongoose.models.ActionItem || mongoose.model('ActionItem', ActionItemSchema);
