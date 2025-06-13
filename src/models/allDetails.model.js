import mongoose from 'mongoose';
import personalLoanModal from './personalLoan.modal.js';
import businessLoanModal from './businessLoan.modal.js';
import registerModel from './register.model.js';
import LoginCount from './loginCount.modal.js';
import appliedCustomersModal from './appliedCustomers.modal.js';

// Schema for AllDetails
const allDetailsSchema = new mongoose.Schema({
  leadId: {
    type: String,
    required: false,
    index: true, // Index on leadId for quicker lookups
  },

  // References to other collections
  personalLoanRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'personalLoan',
    index: true, // Index for faster population of this field
  },
  businessLoanRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'businessLoan',
    index: true, // Index for faster population of this field
  },
  appliedCustomerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'appliedCustomer',
    index: true, // Index for faster population of this field
  },
  registerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'register',
    index: true, // Index for faster population of this field
  },
  loginCountRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoginCount',
    index: true, // Index for faster population of this field
  },

}, { timestamps: true });

// Creating the model
const AllDetails = mongoose.model('AllDetails', allDetailsSchema);

export default AllDetails;
