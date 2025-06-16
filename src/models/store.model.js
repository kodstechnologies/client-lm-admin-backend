import mongoose from 'mongoose';
import { applyAuditMiddleware } from '../Utils/auditFieldsHelper.js';

const storeSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  StoreCode: { type: String, unique: true }, // LMS_100_1000
  Phone: { type: String, required: true, unique: true },
  Email: { type: String },
  Address: { type: String },
  State: { type: String },
  GSTIN: { type: String },
  AccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  AffiliateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate' },
  ChainStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChainStore', required: true },
  ifscCode: { type: String },
  pinCode: { type: String },
  accountNumber: { type: String },
  IsActive: { type: Boolean, default: true },
  chequePhoto: { type: String },
  shopPhoto: { type: String },
  gstCertificate: { type: String },
  LoginCount: { type: Number, default: 0 },
LastLoginDate: { type: Date },

  AuditFields: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

applyAuditMiddleware(storeSchema);

// Auto-generate StoreCode
storeSchema.pre('validate', async function (next) {
  if (this.isNew && !this.StoreCode) {
    try {
      const chainStore = await mongoose.model('ChainStore').findById(this.ChainStoreId);
      if (!chainStore || !chainStore.NumericId) {
        return next(new Error('ChainStore or its NumericId not found'));
      }

      // Retrieve existing StoreCodes for the given ChainStoreId
      const existingStores = await mongoose.model('Store').find(
        { ChainStoreId: this.ChainStoreId },
        { StoreCode: 1 }
      );

      // Extract the numeric part of the StoreCode and determine the maximum
      let maxStoreNumber = 999; // Start from 1000
      existingStores.forEach(store => {
        const match = store.StoreCode?.match(new RegExp(`^LMS_${chainStore.NumericId}_(\\d+)$`));
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > maxStoreNumber) {
            maxStoreNumber = number;
          }
        }
      });

      const nextStoreNumber = maxStoreNumber + 1;
      this.StoreCode = `LMS_${chainStore.NumericId}_${nextStoreNumber}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});


export const Store = mongoose.model('Store', storeSchema);
