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

const router = Router();

// ==================== PUBLIC ROUTES ====================
// Anyone can browse the catalog, view recommendations, look up channels, or play a video
router.route("/").get(getAllVideos);
router.route("/v/:videoId/related").get(getRelatedVideos);
router.route("/c/:username").get(getVideosByChannel);

// Fetching a video detail is public so logged-out guests can watch it!
router.route("/v/:videoId").get(getVideoById); 


// ==================== SECURED MUTATION ROUTES ====================
// Modifying actions (POST, PATCH, DELETE) require a verified user session token
router.route("/v/:videoId")
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo) 
    .delete(verifyJWT, deleteVideo);

router.route("/publish").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

export default router;