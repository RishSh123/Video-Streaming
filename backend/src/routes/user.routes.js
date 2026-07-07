import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    changeCurrentPassword,  // ◄── Add this
    updateAccountDetails,   // ◄── Add this
    updateUserAvatar        // ◄── Add this
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Unprotected route: Handles multi-part forms with Avatar and optional Cover Image files
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

// Unprotected route: Standard login
router.route("/login").post(loginUser);

// Protected route: Uses our verifyJWT middleware before allowing access to logout
router.route("/logout").post(verifyJWT, logoutUser);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

// Uses Multer middleware to grab a single file field named "avatar"
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

export default router;