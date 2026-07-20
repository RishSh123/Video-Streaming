import { Router } from "express";
import { toggleWatchLater, getWatchLaterVideos } from "../controllers/watchLater.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Secure all watch-later tracking scopes

router.route("/").get(getWatchLaterVideos);
router.route("/toggle/:videoId").post(toggleWatchLater);

export default router;