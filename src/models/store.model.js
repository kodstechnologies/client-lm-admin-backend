import mongoose from 'mongoose';
import { applyAuditMiddleware } from '../Utils/auditFieldsHelper.js';

const storeSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Address: { type: String },
  Phone: { type: String, required: true, unique: true },
  Email: { type: String },
  State: { type: String },
  GSTIN: { type: String },

  GroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreGroup',
    required: false
  },
  AffiliateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Affiliate',
    required: false
  },
  AccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: false
  },

  ifscCode: { type: String },
  pinCode: { type: String },
  accountNumber: { type: String },

  gstCertificate: { type: String },
  shopPhoto: { type: String },
  chequePhoto: { type: String },

  IsActive: { type: Boolean },
  AuditFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastLoginDate: {
    type: Date,
    default: Date.now
  },
  // New field to reference Merchant
  MerchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: false
  }
}, {
  timestamps: true
});

applyAuditMiddleware(storeSchema);

export const Store = mongoose.model('Store', storeSchema);
