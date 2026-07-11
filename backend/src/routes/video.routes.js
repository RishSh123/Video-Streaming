import { Router } from "express";
import { 
    publishAVideo, 
    getAllVideos, 
    getVideoById, 
    updateVideo, 
    deleteVideo,
    getRelatedVideos 
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes (anyone can browse catalog or hit a specific video details page)
router.route("/").get(getAllVideos);
// Add this right along your other individual video routes
router.route("/v/:videoId/related").get(getRelatedVideos);
router.route("/v/:videoId")
    .get(getVideoById)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo) // ◄── Add this for updating details/thumbnail
    .delete(verifyJWT, deleteVideo);

// Secured routes (only verified logged-in users can publish content)
router.route("/publish").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

export default router;