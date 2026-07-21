import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Standard uploader for avatars / thumbnails (e.g., 10MB)
export const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Dedicated uploader for large videos (e.g., 500MB)
export const uploadVideo = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB (500 * 1024 * 1024 bytes)
});