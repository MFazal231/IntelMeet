import mongoose from 'mongoose';

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);
