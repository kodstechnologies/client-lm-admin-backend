import mongoose from 'mongoose';
import { applyAuditMiddleware } from '../Utils/auditFieldsHelper.js';

const affiliateSchema = new mongoose.Schema({
  // AffiliateId: { type: String, default: () => `AFID_${new mongoose.Types.ObjectId()}` },
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

applyAuditMiddleware(affiliateSchema)


export const Affiliate = mongoose.model('Affiliate', affiliateSchema);
