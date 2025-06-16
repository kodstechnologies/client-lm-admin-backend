import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storeUploadDir = './store-uploads';
if (!fs.existsSync(storeUploadDir)) {
    fs.mkdirSync(storeUploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, storeUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

export const storeExcelUpload = multer({ storage });
