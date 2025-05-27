import mongoose from 'mongoose';
import { applyAuditMiddleware } from '../Utils/auditFieldsHelper.js';

const accountSchema = new mongoose.Schema({
  // AccouantId: { type: String, default: () => `ACID_${new mongoose.Types.ObjectId()}` },
  AccountName: { type: String, required: true },
  IFSCCode: { type: String },
  AccountNumber: { type: String },
  Description: { type: String },
  IsActive: { type: Boolean, default: true },
  AuditFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

applyAuditMiddleware(accountSchema)


export const Account = mongoose.model('Account', accountSchema);
