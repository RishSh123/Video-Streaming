import { Router } from "express";
import { publishAVideo, getAllVideos, getVideoById } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes (anyone can browse catalog or hit a specific video details page)
router.route("/").get(getAllVideos);
router.route("/v/:videoId").get(getVideoById);

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