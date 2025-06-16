// models/User.js
import mongoose from 'mongoose';
import { applyAuditMiddleware } from '../Utils/auditFieldsHelper.js';

const userSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Phone: { type: String },
  Description: { type: String },
  AuditFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

applyAuditMiddleware(userSchema)


export const User = mongoose.model('User', userSchema);
