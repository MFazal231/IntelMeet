import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: '' },
  theme: { type: String, default: 'dark' },
  role: { type: String, default: 'member' },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
