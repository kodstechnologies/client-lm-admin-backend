import express from "express";
import { emailVerify, verifyOtp, resendOtp } from '../controllers/AuthController.js'
import { getAllDetails, getOffersApi, getSummaryApi, getFilteredData, getFilteredLoans, createAccount, createAffiliate, createStore, createMerchant, getAllMerchants, getAllAccounts, getAllAffiliates, getStoresByMerchant, updateStore, fetchStoreById, editAffiliate, editAccount, getAccountById, getAffiliateById, uploadStore, fetchAllOrders, searchOrderByNumber, fetchAllCustomers, searchCustomersByPhone, updateOrderById } from '../controllers/admin/admin.controller.js'
import { getAllStore } from "../controllers/admin/admin.controller.js";
import { upload } from "../middlewares/multer.js";
import { storeExcelUpload } from "../middlewares/storeUpload.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/email-verification', emailVerify)
router.post('/otp-verification', verifyOtp)

router.post('/resend-otp', resendOtp)
router.get('/all-details',getAllDetails)
router.get('/all-orders', fetchAllOrders)
router.get('/search-orders-by-phone-number', searchOrderByNumber)
router.get('/all-customers', fetchAllCustomers)
router.get('/search-customers-by-phone', searchCustomersByPhone)
router.put('/update-order-by-id/:orderId', updateOrderById)
//test

// router.get('/test-offer', (req, res) => {
//     res.send('Test Offer Route Working');
//   });
router.get('/all-offers/:leadId', getOffersApi)
router.get('/get-summary/:leadId', getSummaryApi)
router.get('/get-filtered-data', getFilteredData)
router.get('/get-filtered-loans', getFilteredLoans)


//store management
router.post('/create-account', authMiddleware, createAccount)
router.post('/create-affiliate', authMiddleware, createAffiliate)
// router.post('/create-store', createStoreGroup)
// router.post('')

router.get('/get-all-stores', getAllStore)



router.post(
    '/merchants/:merchantId/create-store',
    upload.fields([
        { name: 'gstCertificate', maxCount: 1 },
        { name: 'shopPhoto', maxCount: 1 },
        { name: 'chequePhoto', maxCount: 1 }
    ]),
    (req, res, next) => {
        // console.log(' DEBUG MULTER:');
        // console.log('req.body:', req.body);
        // console.log('req.files:', req.files);
        next();
    }, authMiddleware,
    createStore
);
router.post('/create-merchant', authMiddleware, createMerchant)
//m
router.get('/get-all-merchants', getAllMerchants)


// router.get('/all-datatstores', getAllDataStore)
router.get('/all-accounts', getAllAccounts)
router.get('/all-affiliates', getAllAffiliates)

//m
router.get('/get-stores-by-merchant/:merchantId', getStoresByMerchant)
router.put(
    '/stores/:id',
    upload.fields([
        { name: 'gstCertificate', maxCount: 1 },
        { name: 'shopPhoto', maxCount: 1 },
        { name: 'chequePhoto', maxCount: 1 },
    ]), authMiddleware,
    updateStore
);
router.get('/get-store-by-id/:storeId', fetchStoreById)

// router.put('/edit-store-groups/:id', editStoreGroup);
// router.get('/get-data-store-by-id/:id', getDataStoreById)
router.put('/edit-affiliates/:id', authMiddleware, editAffiliate);
router.get('/get-account-by-id/:id', getAccountById)

router.put('/edit-accounts/:id', authMiddleware, editAccount);
router.get('/get-affiliate-by-id/:id', getAffiliateById)

router.post(
    '/upload-store/:merchantId',
    storeExcelUpload.single('file'),
    uploadStore
);


export default router;