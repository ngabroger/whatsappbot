const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/';
        if(!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file,cb) => {
       const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
})

const fileFilter = (req,file,cb) => {
     const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|mp4|mp3/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if(mimetype && extname){
        return cb (null, true);
    }else {
        cb(new Error('INVALID'))
    }
}

const upload = multer({
    storage: storage,
    limits: {fileSize: 16 * 1024 * 1024},
    fileFilter: fileFilter
});

module.exports = upload;


