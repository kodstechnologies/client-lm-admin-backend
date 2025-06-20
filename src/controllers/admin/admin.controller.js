import allDetailsModel from "../../models/allDetails.model.js";
import axios from "axios";
import offerSchema from '../../models/offers.model.js'
import offerSummaryModal from "../../models/offerSummary.modal.js";
import { Account } from "../../models/Account.model.js";
import { Affiliate } from "../../models/Affiliate.model.js";
// import { StoreGroup } from "../../models/StoreGroup.model.js";
import { Store } from "../../models/store.model.js";
import { Merchant } from "../../models/Merchant.model.js";
import mongoose from "mongoose";
import XLSX from 'xlsx';
import fs from 'fs';
import { Counter } from "../../models/Counter.model.js";
import Joi from "joi";
import OrdersModel from "../../models/Orders.model.js";
import { Customer } from "../../models/Customer.model.js";

// export const getAllDetails = async (req, res) => {
//   try {
//     const { search = '' } = req.query;

//     const query = {};

//     if (search) {
//       // Match leadId only at query level
//       query.leadId = { $regex: search, $options: 'i' };
//     }

//     // Fetch and populate everything
//     let details = await allDetailsModel.find(query)
//       .populate('personalLoanRef')
//       .populate('businessLoanRef')
//       .populate('appliedCustomerRef')
//       .populate('registerRef')
//       .populate('loginCountRef')
//       .exec();

//     // If search doesn't match leadId, try filtering by mobileNumber in populated refs
//     if (search && details.length === 0) {
//       // Re-fetch all and filter in JS
//       details = await allDetailsModel.find({})
//         .populate('personalLoanRef')
//         .populate('businessLoanRef')
//         .populate('appliedCustomerRef')
//         .populate('registerRef')
//         .populate('loginCountRef')
//         .exec();

//       details = details.filter(item =>
//         item?.registerRef?.mobileNumber?.includes(search) ||
//         item?.personalLoanRef?.mobileNumber?.includes(search) ||
//         item?.businessLoanRef?.mobileNumber?.includes(search)
//       );
//     }

//     // Add loan type to each item
//     details = details.map(item => {
//       let loanType = null;

//       if (item.personalLoanRef) {
//         loanType = 'Personal Loan';
//       } else if (item.businessLoanRef) {
//         loanType = 'Business Loan';
//       }

//       return {
//         ...item.toObject(), // Convert Mongoose document to plain object
//         loanType, // Add loan type field
//       };
//     });

//     if (!details || details.length === 0) {
//       return res.status(404).json({ success: false, message: 'No details found' });
//     }

//     res.status(200).json({
//       success: true,
//       data: details,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const getAllDetails = async (req, res) => {
  try {
    const { search = '' } = req.query;

    const query = {};

    if (search) {
      // Match leadId only at query level
      query.leadId = { $regex: search, $options: 'i' };
    }

    // Fetch and populate everything
    let details = await allDetailsModel.find(query)
      .populate('personalLoanRef')
      .populate('businessLoanRef')
      .populate('appliedCustomerRef')
      .populate('registerRef')
      .populate('loginCountRef')
      .exec();

    // If search doesn't match leadId, try filtering by mobileNumber in populated refs
    if (search && details.length === 0) {
      // Re-fetch all and filter in JS
      details = await allDetailsModel.find({})
        .populate('personalLoanRef')
        .populate('businessLoanRef')
        .populate('appliedCustomerRef')
        .populate('registerRef')
        .populate('loginCountRef')
        .exec();

      details = details.filter(item =>
        item?.registerRef?.mobileNumber?.includes(search) ||
        item?.personalLoanRef?.mobileNumber?.includes(search) ||
        item?.businessLoanRef?.mobileNumber?.includes(search)
      );
    }

    // Add loan type to each item
    details = details.map(item => {
      let loanType = null;

      if (item.personalLoanRef) {
        loanType = 'Personal Loan';
      } else if (item.businessLoanRef) {
        loanType = 'Business Loan';
      }

      return {
        ...item.toObject(), // Convert Mongoose document to plain object
        loanType, // Add loan type field
      };
    });

    if (!details || details.length === 0) {
      return res.status(404).json({ success: false, message: 'No details found' });
    }

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};





export const getOffersApi = async (req, res) => {
  const { leadId } = req.params;
  try {

    const axiosInstance = axios.create({
      baseURL: process.env.API_BASE_URL,
      headers: {
        'apikey': process.env.API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const response = await axiosInstance.get(`/partner/get-offers/${leadId}`);
    console.log("reasponse", response.data);
    res.status(200).json(response.data);
    const data = response.data;
    if (data.success === "true" && Array.isArray(data.offers) && data.offers.length > 0) {
      // Replace existing document for that leadId0
      await offerSchema.findOneAndUpdate(
        { leadId },
        { leadId, offers: data.offers },
        { upsert: true, new: true }
      );
      // await appliedCustomersModal.findByIdAndUpdate(
      //   {leadId},
      //   {lenderName}
      // )
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching offers:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to fetch offers',
    });
  }
};

export const getSummaryApi = async (req, res) => {
  const { leadId } = req.params;
  // console.log("req params",req.params);
  console.log("🚀 ~ getSummaryApi ~ leadId:", leadId)
  try {
    const axiosInstance = axios.create({
      baseURL: process.env.API_BASE_URL,
      headers: {
        'apikey': process.env.API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const response = await axiosInstance.get(`/partner/get-summary/${leadId}`);
    const summaryData = response.data;
    console.log("🚀 ~ getSummaryApi ~ response:", response)
    console.log("summary ", summaryData);


    if (summaryData.success) {
      const {
        offersTotal,
        maxLoanAmount,
        minMPR,
        maxMPR,
      } = summaryData.summary;
      const redirectionUrl = summaryData.redirectionUrl;

      // Save to DB (create or update if already exists)
      const saved = await offerSummaryModal.findOneAndUpdate(
        { leadId }, // find by leadId
        { leadId, offersTotal, maxLoanAmount, minMPR, maxMPR, redirectionUrl }, // update fields
        { upsert: true, new: true } // create if not exists
      );

      res.status(200).json(summaryData);
    } else {
      res.status(400).json({ success: false, message: 'API did not return success' });
    }

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch and save summary' });
  }
}

//fliter based on created at and updated at(pl and bl)
export const getFilteredData = async (req, res) => {
  try {
    const { from, to, type = 'created' } = req.query;

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (toDate) {
      toDate.setHours(23, 59, 59, 999); // include the full day
    }

    const dateField = type === 'updated' ? 'updatedAt' : 'createdAt';

    console.log('🕒 Date Filter:', { fromDate, toDate, type });

    // Pipeline starts with $lookup
    const pipeline = [
      {
        $lookup: {
          from: 'personalloans',
          localField: 'personalLoanRef',
          foreignField: '_id',
          as: 'personalLoan',
        },
      },
      {
        $lookup: {
          from: 'businessloans',
          localField: 'businessLoanRef',
          foreignField: '_id',
          as: 'businessLoan',
        },
      },
      {
        $addFields: {
          personalLoan: { $arrayElemAt: ['$personalLoan', 0] },
          businessLoan: { $arrayElemAt: ['$businessLoan', 0] },
        },
      },
    ];

    // Add match only if both fromDate and toDate are provided
    if (fromDate && toDate) {
      pipeline.push({
        $match: {
          $or: [
            { [`personalLoan.${dateField}`]: { $gte: fromDate, $lte: toDate } },
            { [`businessLoan.${dateField}`]: { $gte: fromDate, $lte: toDate } },
          ],
        },
      });
    }

    const result = await allDetailsModel.aggregate(pipeline);

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'No details found' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Server Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



export const getFilteredLoans = async (req, res) => {
  try {
    const { loanType } = req.query;

    // Check if loanType is provided
    if (!loanType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a loan type (personal or business)',
      });
    }

    // Construct the query to filter by loanType
    const query = {};

    // Filter based on loan type
    if (loanType === 'personal') {
      query.personalLoanRef = { $exists: true }; // Filter for personal loans
    } else if (loanType === 'business') {
      query.businessLoanRef = { $exists: true }; // Filter for business loans
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan type. Please use "personal" or "business".',
      });
    }

    // Fetch the details from the database based on the loan type
    const details = await allDetailsModel.find(query)
      .populate('personalLoanRef')
      .populate('businessLoanRef')
      .populate('appliedCustomerRef')
      .populate('registerRef')
      .populate('loginCountRef')
      .exec();

    // If no details found
    if (!details || details.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No ${loanType} loans found.`,
      });
    }

    // Return the filtered loan details
    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//create account
const accountSchema = Joi.object({
  AccountName: Joi.string().min(2).max(100).required(),
  AccountNumber: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'Account Number must be numeric.',
  }),
  IFSCCode: Joi.string().alphanum().required(),
  Description: Joi.string().allow('', null),
  IsActive: Joi.boolean().optional()


});

// export const createAccount = async (req, res) => {
//   try {
//     // Validate request body using Joi
//     const { error, value } = accountSchema.validate(req.body, { abortEarly: false });

//     if (error) {
//       const errors = error.details.map((detail) => detail.message);
//       return res.status(400).json({ message: 'Validation failed', errors });
//     }

//     const { AccountName, AccountNumber, IFSCCode, Description, IsActive } = value;

//     // Create and save new account
//     const newAccount = new Account({
//       AccountName,
//       AccountNumber,
//       IFSCCode,
//       Description,
//       IsActive
//     });
//     newAccount.setUser(req.user?.name || 'system');
//     const savedAccount = await newAccount.save();

//     return res.status(201).json({
//       message: 'Account created successfully',
//       data: savedAccount,
//     });
//   } catch (error) {
//     console.error('Error creating account:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };



export const createAccount = async (req, res) => {
  try {
    // Validate request body using Joi
    const { error, value } = accountSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const { AccountName, AccountNumber, IFSCCode, Description, IsActive } = value;

    // Extract user's identity (name or phone)
    const createdBy = req.user?.name || req.user?.phone || 'system';

    // Create and save new account
    const newAccount = new Account({
      AccountName,
      AccountNumber,
      IFSCCode,
      Description,
      IsActive
    });
    console.log("User object:", req.user);

    const userForAudit = {
      number: req.user?.phone || req.user?.name || 'system',

    };
    // Set user for audit logging
    newAccount.setUser(userForAudit);
    console.log("🚀 ~ createAccount ~ req.user?.name:", req.user?.name)
    console.log("🚀 ~ createAccount ~  req.user?.phone:", req.user?.phone)
    const savedAccount = await newAccount.save();

    return res.status(201).json({
      message: 'Account created successfully',
      data: savedAccount,
    });
  } catch (error) {
    console.error('Error creating account:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


//create affiliate
const affiliateSchema = Joi.object({
  Name: Joi.string().min(2).max(100).required(),
  Phone: Joi.string().pattern(/^\d{10}$/).allow('', null),
  Email: Joi.string().email().allow('', null),
  Description: Joi.string().allow('', null),
  IsActive: Joi.boolean().optional()
});
// export const createAffiliate = async (req, res) => {
//   try {
//     const { error, value } = affiliateSchema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ message: error.details[0].message });
//     }

//     const newAffiliate = new Affiliate(value);
//     newAffiliate.setUser(req.user?.name || 'system'); // ✅ Set createdBy
//     const saved = await newAffiliate.save();
//     return res.status(201).json({ message: 'Affiliate created', data: saved });
//   } catch (error) {
//     console.error('Error creating affiliate:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };


export const createAffiliate = async (req, res) => {
  try {
    const { error, value } = affiliateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const newAffiliate = new Affiliate(value);

    // Prepare user object with 'number' property expected by middleware
    const userForAudit = {
      number: req.user?.phone || req.user?.name || 'system',

    };

    newAffiliate.setUser(userForAudit);

    const savedAffiliate = await newAffiliate.save();

    return res.status(201).json({ message: 'Affiliate created successfully', data: savedAffiliate });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


// export const createAffiliate = async (req, res) => {
//   try {
//     const { error, value } = affiliateSchema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ message: error.details[0].message });
//     }

//     const newAffiliate = new Affiliate(value);
//     newAffiliate.setUser(req.user?.name || req.user?.phone || 'system');

//     const savedAffiliate = await newAffiliate.save();
//     return res.status(201).json({ message: 'Affiliate created successfully', data: savedAffiliate });

//   } catch (error) {
//     // Handle duplicate key error (E11000)
//     if (error.code === 11000) {
//       const duplicateField = Object.keys(error.keyValue)[0];
//       const duplicateValue = error.keyValue[duplicateField];
//       return res.status(409).json({
//         message: `Duplicate entry: ${duplicateField} "${duplicateValue}" already exists.`,
//         field: duplicateField,
//       });
//     }

//     console.error('Error creating affiliate:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };





//create store group
// const storeGroupSchema = Joi.object({
//   Name: Joi.string().min(2).max(100).required(),
//   Phone: Joi.string().pattern(/^\d{10}$/).allow('', null),
//   Email: Joi.string().email().allow('', null),
//   Description: Joi.string().allow('', null),
//   IsActive: Joi.boolean().optional()
// });
// export const createStoreGroup = async (req, res) => {
//   try {
//     const { error, value } = storeGroupSchema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ message: error.details[0].message });
//     }

//     const newGroup = new StoreGroup(value);
//     newGroup.setUser(req.user?.name || 'system');
//     const saved = await newGroup.save();

//     return res.status(201).json({ message: 'Store Group created', data: saved });
//   } catch (error) {
//     console.error('Error creating store group:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };


//create store


// Joi validation schema

export const storeSchema = Joi.object({
  Name: Joi.string().min(2).max(100).required(),
  Phone: Joi.string().pattern(/^\d{10}$/).required(),
  Email: Joi.string().email().required(),
  Address: Joi.string().required(),
  State: Joi.string().required(),
  GSTIN: Joi.string().required(),
  ifscCode: Joi.string().optional().allow(""),
  pinCode: Joi.string().optional().allow(""),
  accountNumber: Joi.string().optional().allow(""),
  // GroupId: Joi.string().required(),
  AffiliateId: Joi.required(),
  AccountId: Joi.required(),
  IsActive: Joi.boolean().optional(),

  // These should be strings (file paths)
  chequePhoto: Joi.string().allow('').optional(),
  shopPhoto: Joi.string().allow('').optional(),
  gstCertificate: Joi.string().allow('').optional(),
});
// export const getCleanObjectId = (idWithPrefix) => {
//   if (!idWithPrefix) return null;
//   const parts = idWithPrefix.split('_');
//   if (parts.length === 2 && mongoose.Types.ObjectId.isValid(parts[1])) {
//     return new mongoose.Types.ObjectId(parts[1]);
//   }
//   return null;
// };

export const createStore = async (req, res) => {
  try {
    // console.log('Request body:', req.body);

    const { merchantId } = req.params;
    // console.log('Uploaded files:', req.files);

    // Extract form fields and file paths
    const {
      Name, Address, Phone, Email, State, GSTIN,
      AffiliateId, AccountId,
      ifscCode, pinCode, accountNumber, IsActive
    } = req.body;

    // Extract file paths (if uploaded)
    const gstCertificate = req.files?.gstCertificate?.[0]?.filename || '';
    const shopPhoto = req.files?.shopPhoto?.[0]?.filename || '';
    const chequePhoto = req.files?.chequePhoto?.[0]?.filename || '';

    // Validate the request
    const { error, value } = storeSchema.validate({
      Name, Address, Phone, Email, State, GSTIN,
      AffiliateId, AccountId,
      ifscCode, pinCode, accountNumber, IsActive,
      chequePhoto, shopPhoto, gstCertificate
    });

    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(d => d.message),
      });
    }

    // Check if merchant exists
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    // Clean ObjectIds
    const cleanGroupId = merchantId
    // const cleanAffiliateId = getCleanObjectId(AffiliateId);
    // const cleanAccountId = getCleanObjectId(AccountId);

    // if (!cleanGroupId || !cleanAffiliateId || !cleanAccountId) {
    //   return res.status(400).json({ message: 'Invalid GroupId, AffiliateId, or AccountId' });
    // }

    // Create new store
    // Create new store instance
    const store = new Store({
      Name,
      Address,
      Phone,
      Email,
      State,
      GSTIN,
      // GroupId: cleanGroupId,
      AffiliateId: AffiliateId,
      AccountId: AccountId,
      ifscCode,
      pinCode,
      accountNumber,
      IsActive,
      chequePhoto,
      shopPhoto,
      gstCertificate,
      ChainStoreId: merchantId
    });
    console.log("✅ req.user:", req.user);

    //  Set audit user (you can use name or full object based on your auditFieldsHelper)
    store.setUser({ number: req.user?.phone || req.user?.name || 'system', }); // or just req.user.name

    // Save store with audit info
    const newStore = await store.save();
    return res.status(201).json({
      success: true,
      message: 'Store created successfully',
      store: newStore
    });

  } catch (error) {
    console.error('Error creating store:', error);

    //  Handle duplicate key error (E11000)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      return res.status(409).json({
        message: `Duplicate entry: ${duplicateField} "${duplicateValue}" already exists.`,
        field: duplicateField,
      });
    }

    return res.status(500).json({ message: 'Server Error' });
  }
};

// export const createStore = async (req, res) => {
//   try {
//     const { merchantId } = req.params;
//     // ✅ Check if merchant exists
//     const merchant = await Merchant.findById(merchantId);
//     if (!merchant) {
//       return res.status(404).json({ message: 'Merchant not found' });
//     }

//     // ✅ Validate req.body using Joi
//     const { error, value } = storeSchema.validate(req.body);
//     if (error) {
//       return res.status(400).json({
//         message: 'Validation error',
//         details: error.details.map(d => d.message),
//       });
//     }

//     const {
//       Name, Address, Phone, Email, State, GSTIN,
//       GroupId, AffiliateId, AccountId,
//       ifscCode, pinCode, accountNumber,
//       gstCertificate, shopPhoto, chequePhoto,
//     } = value;


//     // ✅ Create the store with merchantId
//     const newStore = await Store.create({
//       Name,
//       Address,
//       Phone,
//       Email,
//       State,
//       GSTIN,
//       GroupId,
//       AffiliateId,
//       AccountId,
//       ifscCode,
//       pinCode,
//       accountNumber,
//       gstCertificate,
//       shopPhoto,
//       chequePhoto,
//       MerchantId: merchantId, // auto-attached
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Store created successfully',
//       store: newStore,
//     });
//   } catch (error) {
//     console.error('Error creating store:', error);
//     return res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

// export const createStore = async (req, res) => {
//   try {
//     // Validate text fields in the body
//     const { error, value } = storeSchema.validate(req.body);

//     if (error) {
//       return res.status(400).json({
//         message: 'Validation error',
//         details: error.details.map(detail => detail.message),
//       });
//     }

//     const {
//       Name, Phone, Email, GSTIN, Address, State,
//       ifscCode, pinCode, accountNumber
//     } = value;

//     // Handle uploaded files via Multer
//     const gstCertificate = req.files?.gstCertificate?.[0]?.path || '';
//     const shopPhoto = req.files?.shopPhoto?.[0]?.path || '';
//     const chequePhoto = req.files?.chequePhoto?.[0]?.path || '';

//     // Get or create Group
//     let group = await StoreGroup.findOne();
//     if (!group) {
//       group = new StoreGroup({ Name: 'Default Store Group' });
//       group.setUser(req.user?.name || 'system');
//       await group.save();
//     }

//     // Get or create Affiliate
//     let affiliate = await Affiliate.findOne();
//     if (!affiliate) {
//       affiliate = new Affiliate({ Name: 'Default Affiliate' });
//       affiliate.setUser(req.user?.name || 'system');
//       await affiliate.save();
//     }

//     // Get or create Account
//     let account = await Account.findOne();
//     if (!account) {
//       account = new Account({ AccountName: 'Default Account' });
//       account.setUser(req.user?.name || 'system');
//       await account.save();
//     }

//     // Create the Store
//     const newStore = new Store({
//       Name,
//       Phone,
//       Email,
//       GSTIN,
//       Address,
//       State,
//       ifscCode,
//       pinCode,
//       accountNumber,
//       GroupId: group._id,
//       AffiliateId: affiliate._id,
//       AccountId: account._id,
//       gstCertificate,
//       shopPhoto,
//       chequePhoto
//     });

//     newStore.setUser(req.user?.name || 'system');
//     await newStore.save();

//     return res.status(201).json({
//       message: 'Store created successfully',
//       store: newStore,
//     });

//   } catch (error) {
//     console.error('Error:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };


//get all store





export const getAllStore = async (req, res) => {
  try {
    const stores = await Store.find();
    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}


//create merchant
const merchantSchema = Joi.object({
  Name: Joi.string().min(2).max(100).required(),
  Phone: Joi.string().allow(''),
  Email: Joi.string().email().allow(''),
  Address: Joi.string().allow(''),
  State: Joi.string().allow(''),
  GSTIN: Joi.string().allow(''),
  GroupId: Joi.string().allow(''),
  Description: Joi.string().allow(''),
  AffiliateId: Joi.string().allow(''),
  AccountId: Joi.string().allow(''),
  Description: Joi.string().allow(''),
  IsActive: Joi.boolean()
});

export const createMerchant = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = merchantSchema.validate(req.body);
    console.log("IsActive received from frontend:", req.body.IsActive); // ✅ Add this

    if (error) {
      console.log('Validation error:', error.details);
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message),
      });
    }

    const { Name, Phone, Email, GSTIN, Address, State, Description, IsActive } = value;

    // Fetch or create GroupId
    // let group = await StoreGroup.findOne();
    // if (!group) {
    //   group = new StoreGroup({ Name: 'Default Store Group' });
    //   group.setUser(req.user?.name || 'system');
    //   await group.save();
    // }

    // // Fetch or create AffiliateId
    // let affiliate = await Affiliate.findOne();
    // if (!affiliate) {
    //   affiliate = new Affiliate({ Name: 'Default Affiliate' });
    //   affiliate.setUser(req.user?.name || 'system');
    //   await affiliate.save();
    // }

    // // Fetch or create AccountId
    // let account = await Account.findOne();
    // if (!account) {
    //   account = new Account({ AccountName: 'Default Account' });
    //   account.setUser(req.user?.name || 'system');
    //   await account.save();
    // }

    // Create merchant
    const newMerchant = new Merchant({
      Name,
      Phone,
      Email,
      GSTIN,
      Address,
      State,
      Description,
      IsActive
      // GroupId: group._id,
      // AffiliateId: affiliate._id,
      // AccountId: account._id
    });
    console.log(" req.user:", req.user);


    // newMerchant.setUser({ name: req.user?.name || 'system', id: req.user?.id || null });
    newMerchant.setUser({
      number: req.user?.phone || req.user?.name || 'system',
    });

    console.log('User being set:', newMerchant._user);

    await newMerchant.save();
    return res.status(201).json({
      message: 'Merchant created successfully',
      merchant: newMerchant,
    });
  } catch (error) {
    console.error('Error creating merchant:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      return res.status(409).json({
        message: `Duplicate entry: ${duplicateField} "${duplicateValue}" already exists.`,
        field: duplicateField,
      });
    }

    return res.status(500).json({ message: 'Internal server error' });

  }
};

export const getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find() // Sort by latest created

    return res.status(200).json({
      message: 'Merchants fetched successfully',
      merchants,
    });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};


//fetch all affiliate
export const getAllAffiliates = async (req, res) => {
  try {
    const affiliates = await Affiliate.find();
    return res.status(200).json({ message: 'All affiliates fetched successfully', data: affiliates });
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find();
    return res.status(200).json({ message: 'All accounts fetched successfully', data: accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// export const getAllDataStore = async (req, res) => {
//   try {
//     const storeGroups = await StoreGroup.find().sort({ createdAt: -1 });
//     return res.status(200).json({ message: 'All store groups fetched successfully', data: storeGroups });
//   } catch (error) {
//     console.error('Error fetching store groups:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };

export const getStoresByMerchant = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const stores = await Store.find({ ChainStoreId: new mongoose.Types.ObjectId(merchantId) });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const updatedStores = stores.map(store => ({
      ...store._doc,
      shopPhoto: store.shopPhoto ? `${baseUrl}/uploads/${store.shopPhoto}` : '',
      gstCertificate: store.gstCertificate ? `${baseUrl}/uploads/${store.gstCertificate}` : '',
      chequePhoto: store.chequePhoto ? `${baseUrl}/uploads/${store.chequePhoto}` : '',
    }));

    res.json(updatedStores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const fetchStoreById = async (req, res) => {
  try {
    const { storeId } = req.params; // Get store ID from URL parameter
    const store = await Store.findById(storeId).populate({
      path: 'ChainStoreId',
      select: 'Name' // Only fetch the Name field
    });
    console.log("🚀 ~ fetchStoreById ~ store:", store)
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    return res.status(200).json(store); // Return store data
  } catch (error) {
    console.error('Error fetching store:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};




export const updateStore = async (req, res) => {
  try {
    const storeId = req.params.id;

    // Find the store by ID
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Fields to update
    const updatableFields = [
      'Name', 'Address', 'Phone', 'Email', 'State',
      'GSTIN', 'IsActive', 'pinCode', 'ifscCode', 'accountNumber'
    ];

    // Update fields from body
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        store[field] = req.body[field];
      }
    });

    // ObjectId fields (strip prefixes)
    const objectIdFields = ['GroupId', 'AffiliateId', 'AccountId'];
    objectIdFields.forEach(field => {
      let value = req.body[field];
      if (value && typeof value === 'string') {
        value = value.replace(/^(GRID_|AFID_|ACID_)/, '');
      }
      if (value && mongoose.Types.ObjectId.isValid(value)) {
        store[field] = new mongoose.Types.ObjectId(value);
      } else if (value) {
        console.warn(`Invalid ObjectId for ${field}:`, value);
      }
    });

    // File uploads
    if (req.files?.gstCertificate?.[0]) {
      store.gstCertificate = req.files.gstCertificate[0].path;
    }
    if (req.files?.shopPhoto?.[0]) {
      store.shopPhoto = req.files.shopPhoto[0].path;
    }
    if (req.files?.chequePhoto?.[0]) {
      store.chequePhoto = req.files.chequePhoto[0].path;
    }

    // Set user for audit
    // const userIdentifier = req.user?.name || req.user?.number || 'system';
    const userForAudit = {
      number: req.user?.phone || req.user?.name || 'system',

    };
    store.setUser(userForAudit);

    // Save updated store
    await store.save();

    return res.status(200).json({
      message: 'Store updated successfully',
      data: store
    });

  } catch (error) {
    console.error('Update store error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
};


//edit store group 

// export const editStoreGroup = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updatedData = req.body;

//     const storeGroup = await StoreGroup.findByIdAndUpdate(id, updatedData, {
//       new: true, // returns updated document
//       runValidators: true, // runs schema validation
//     });

//     if (!storeGroup) {
//       return res.status(404).json({ message: 'Store Group not found' });
//     }

//     res.status(200).json({ message: 'Store Group updated successfully', data: storeGroup });
//   } catch (error) {
//     console.error('Error updating store group:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


//get store group by id

// export const getDataStoreById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Validate ID presence
//     if (!id) {
//       return res.status(400).json({ message: 'Store Group ID is required.' });
//     }

//     // Find the store group by MongoDB _id or custom GroupId
//     const storeGroup = await StoreGroup.findOne({
//       $or: [{ _id: id }, { GroupId: id }]
//     });

//     if (!storeGroup) {
//       return res.status(404).json({ message: 'Store Group not found.' });
//     }

//     res.status(200).json(storeGroup);
//   } catch (error) {
//     console.error('Error fetching store group:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };


//edit affiliate
export const editAffiliate = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    // Find the affiliate by id
    const affiliate = await Affiliate.findById(id);
    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found' });
    }

    // Update fields manually from updatedData
    Object.keys(updatedData).forEach(key => {
      affiliate[key] = updatedData[key];
    });

    // Set user for audit (assuming setUser accepts object or string)
    const userForAudit = {
      number: req.user?.phone || req.user?.name || 'system',

    };
    affiliate.setUser(userForAudit);

    // Save updated affiliate document (important!)
    await affiliate.save();

    console.log("🚀 ~ editAffiliate ~ req.user:", req.user);

    res.status(200).json({ message: 'Affiliate updated successfully', data: affiliate });
  } catch (error) {
    console.error('Error updating affiliate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
//get affiliate by id


export const getAffiliateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Affiliate ID is required.' });
    }

    const affiliate = await Affiliate.findOne({
      $or: [{ _id: id }, { AffiliateId: id }]
    });

    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate not found.' });
    }

    res.status(200).json(affiliate);
  } catch (error) {
    console.error('Error fetching affiliate:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

//edit account

export const editAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Find the account first
    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Manually update only allowed fields from req.body
    Object.keys(updatedData).forEach(key => {
      account[key] = updatedData[key];
    });

    // Set audit user (will set updatedBy field in AuditFields)
    const userForAudit = {
      number: req.user?.phone || req.user?.name || 'system',

    };
    account.setUser(userForAudit);

    // Save changes
    await account.save();

    console.log("🚀 ~ editAccount ~ req.user:", req.user);

    res.status(200).json({ message: 'Account updated successfully', data: account });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//get account by id

export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Account ID is required.' });
    }

    const account = await Account.findOne({
      $or: [{ _id: id }, { AccountId: id }]
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    res.status(200).json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const uploadStore = async (req, res) => {
  const merchantId = req.params.merchantId;

  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    // Fetch chain store to get NumericId
    const chainStore = await Merchant.findById(merchantId);
    if (!chainStore || !chainStore.NumericId) {
      return res.status(400).json({ message: 'Invalid ChainStore ID or missing NumericId' });
    }

    // Get next sequence from counter
    const counter = await Counter.findOneAndUpdate(
      { chainStoreNumericId: chainStore.NumericId },
      { $inc: { seq: jsonData.length } },
      { new: true, upsert: true }
    );

    let currentSeq = counter.seq - jsonData.length + 1;

    // Prepare store data
    const storeData = await Promise.all(jsonData.map(async (row) => {
      let affiliate = null;
      if (row.AffiliateId) {
        affiliate = await Affiliate.findById(String(row.AffiliateId).trim());
      }

      let group = null;
      if (row.GroupId) {
        group = await StoreGroup.findOne({ GroupId: String(row.GroupId).trim() });
      }

      let account = null;
      if (row.AccountId) {
        account = await Account.findById(String(row.AccountId).trim());
      }

      const storeCode = `LMS_${chainStore.NumericId}_${1000 + currentSeq++}`;

      return {
        Name: row.Name?.toString().trim() || '',
        Address: row.Address?.toString().trim() || '',
        pinCode: row.Pincode?.toString().trim() || '',
        Phone: row.Phone?.toString().trim() || '',
        Email: row.Email?.toString().trim() || '',
        State: row.State?.toString().trim() || '',
        GSTIN: row.GSTIN?.toString().trim() || '',
        GroupId: group?._id || null,
        AffiliateId: affiliate?._id || null,
        AccountId: account?._id || null,
        ChainStoreId: merchantId,
        StoreCode: storeCode,
        IsActive: true,
        LoginCount: 0,
        AuditFields: {
          createdBy: 'system',
          createdAt: new Date()
        },
        __bulk: true //  used to bypass schema auto StoreCode
      };
    }));

    const insertedStores = await Store.insertMany(storeData);
    fs.unlinkSync(filePath);

    res.status(200).json({ message: 'Stores uploaded successfully', data: insertedStores });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};



// export const uploadStore = async (req, res) => {
//  const merchantId = req.params.merchantId;
//     if (!merchantId) {
//       return res.status(400).json({ message: 'Merchant ID is required in URL' });
//     }

//     const filePath = req.file.path;
//     const workbook = XLSX.readFile(filePath);
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const jsonData = XLSX.utils.sheet_to_json(sheet);

//     const storeData = await Promise.all(jsonData.map(async (row) => {
//       let affiliate = null;
//       if (row.AffiliateId) {
//         const affiliateId = String(row.AffiliateId).trim();
//         affiliate = await Affiliate.findOne({ AffiliateId: affiliateId });
//       }

//       let group = null;
//       if (row.GroupId) {
//         const groupId = String(row.GroupId).trim();
//         group = await StoreGroup.findOne({ GroupId: groupId });
//       }

//       let account = null;
//       if (row.AccountId) {
//         const accountId = String(row.AccountId).trim();
//         account = await Account.findOne({ AccountId: accountId });
//       }

//       return {
//         Name: row.Name,
//         Address: row.Address || '',
//         Phone: row.Phone || '',
//         Email: row.Email || '',
//         State: row.State || '',
//         GSTIN: row.GSTIN || '',

//         MerchantId: merchantId, // 👈 Add this line
//         GroupId: group ? group._id : null,
//         AffiliateId: affiliate ? affiliate._id : null,
//         AccountId: account ? account._id : null,

//         IsActive: true,
//         LoginCount: 0,
//         AuditFields: {
//           createdBy: 'system',
//           createdAt: new Date()
//         }
//       };
//     }));

//     const insertedStores = await Store.insertMany(storeData);

//     fs.unlinkSync(filePath);

//     res.status(200).json({ message: 'Stores uploaded successfully', data: insertedStores });
// }

//ALL ORDERS
export const fetchAllOrders = async (req, res) => {
  try {
    // Fetch all orders from the database
    const orders = await OrdersModel.find().sort({ updatedAt: -1 });

    // Send orders as JSON response
    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

export const searchOrderByNumber = async (req, res) => {
  try {
    const { number } = req.query;
    // const { storeId } = req.store;

    if (!number) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    // if (!storeId) {
    //   return res.status(400).json({ message: 'Store ID is missing from token' });
    // }

    const now = new Date();

    const orders = await OrdersModel.find({
      number,
      // storeId,
      // eligibility_expiry_date: { $gte: now },
    }).sort({ updatedAt: -1 });
    console.log("🚀 ~ searchOrderByNumber ~ orders:", orders)

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this number' });
    }

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Search Order Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


export const fetchAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ updatedAt: -1 }); // Fetch all customers

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

export const searchCustomersByPhone = async (req, res) => {
  try {
    const { mobileNumber } = req.query;

    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: "mobileNumber is required" });
    }

    // Search using regex for partial match or exact match (you can choose)
    const customers = await Customer.find({
      mobileNumber: { $regex: mobileNumber, $options: 'i' }
    }).sort({ updatedAt: -1 });
    console.log("🚀 ~ searchCustomersByPhone ~ customers:", customers)

    res.status(200).json({ success: true, customers });
  } catch (error) {
    console.error("Error in searchCustomersByPhone:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Step 1: Find the order to get customerId
    const order = await OrdersModel.findOneAndUpdate(
      { orderId },
      { status: "Completed" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Step 2: Update the related customer document's status
    await Customer.findByIdAndUpdate(order.customerId, {
      status: "Completed",
    });

    return res.status(200).json({ success: true, message: "Order and customer updated" });

  } catch (err) {
    console.error("Error updating order or customer:", err);
    return res.status(500).json({ error: "Failed to update order and customer." });
  }
};