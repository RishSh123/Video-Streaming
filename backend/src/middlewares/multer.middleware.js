import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Temporary folder on our disk where files will reside before cloud transit
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        // Keep original file names for clear cloud tracking, appending unique timestamps if needed
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit files (like avatars) to 5MB for now
});