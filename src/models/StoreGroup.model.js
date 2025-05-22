import mongoose from 'mongoose';
import { applyAuditMiddleware } from '../Utils/auditFieldsHelper.js';

const storeGroupSchema = new mongoose.Schema({
  GroupId: { type: String, default: () => `GRID_${new mongoose.Types.ObjectId()}` },
  Name: { type: String, required: true },
  Phone: { type: String },
  Email: { type: String },
  IsActive: { type: Boolean, default: true },
  Description: { type: String },
  AuditFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

applyAuditMiddleware(storeGroupSchema)

export const StoreGroup = mongoose.model('StoreGroup', storeGroupSchema);
