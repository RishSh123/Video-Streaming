import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    changeCurrentPassword,  
    updateAccountDetails,  
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ==================== UNPROTECTED / PUBLIC ROUTES ====================

// Handles multi-part forms with Avatar and optional Cover Image files
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

// Standard user authentication login entry point
router.route("/login").post(loginUser);

// FIXED: Channel lookups are now public so logged-out guests can browse profiles!
router.route("/c/:username").get(getUserChannelProfile);


// ==================== SECURED / PROTECTED ROUTES ====================

// Session lifecycle tracking
router.route("/logout").post(verifyJWT, logoutUser);

// Account credentials and text attributes management
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

// Updates avatar asset file track using Multer parsing validation
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// Private historical playback tracking indexes
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;