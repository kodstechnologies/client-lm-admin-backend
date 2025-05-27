import mongoose from 'mongoose';
import { applyAuditMiddleware } from '../Utils/auditFieldsHelper.js';

const chainStoreSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Code: { type: String, required: true, unique: true },
  NumericId: { type: Number, unique: true }, // auto-generated
  Address: { type: String },
  Phone: { type: String, required: true, unique: true },
  Email: { type: String },
  State: { type: String },
  GSTIN: { type: String },
  Description: { type: String },
  LastLoginDate: { type: Date },
  LoginCount: { type: Number, default: 0 },
  IsActive: { type: Boolean, default: true },
  AuditFields: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

applyAuditMiddleware(chainStoreSchema);

// Auto-generate Code and NumericId
chainStoreSchema.pre('validate', async function (next) {
  if (this.isNew) {
    // Generate Code from Name (optional)
    const baseCode = this.Name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
    let codeCandidate = baseCode;
    let suffix = 0;
    while (await mongoose.models.ChainStore.exists({ Code: codeCandidate })) {
      suffix++;
      codeCandidate = baseCode + suffix;
    }
    this.Code = codeCandidate;

    // Generate NumericId: e.g., 100, 200, 300...
    const latest = await mongoose.models.ChainStore.findOne({});
    this.NumericId = latest?.NumericId ? latest.NumericId + 100 : 100;
  }
  next();
});

export const Merchant = mongoose.model('ChainStore', chainStoreSchema);
