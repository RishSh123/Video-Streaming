import { Router } from "express";
import { 
    publishAVideo, 
    getAllVideos, 
    getVideoById, 
    updateVideo, 
    deleteVideo,
    getRelatedVideos,
    getVideosByChannel
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadVideo } from "../middlewares/multer.middleware.js";

const router = Router();

// Helper middleware: Parses JWT token if present, but lets guests through!
const optionalVerifyJWT = (req, res, next) => {
    if (req.cookies?.accessToken || req.header("Authorization")) {
        return verifyJWT(req, res, next);
    }
    next();
};

// ==================== PUBLIC & OPTIONAL AUTH ROUTES ====================
// Anyone can browse the catalog, view recommendations, look up channels
router.route("/").get(getAllVideos);
router.route("/v/:videoId/related").get(getRelatedVideos);
router.route("/c/:username").get(getVideosByChannel);

// ◄── FIXED: Apply optionalVerifyJWT so logged-in users get req.user populated!
router.route("/v/:videoId").get(optionalVerifyJWT, getVideoById); 


// ==================== SECURED MUTATION ROUTES ====================
// Modifying actions (POST, PATCH, DELETE) require a verified user session token
router.route("/v/:videoId")
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo) 
    .delete(verifyJWT, deleteVideo);

router.route("/publish").post(
    verifyJWT,
    uploadVideo.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

export default router;