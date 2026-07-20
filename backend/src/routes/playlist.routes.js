import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// 1. PUBLIC READ BASE PATHS
router.route("/user/:userId").get(getUserPlaylists);

// 2. PROTECTED LAYER FOR CREATION
router.use(verifyJWT);

// ◄── MOVED UP: Declare the absolute root route BEFORE dynamic parameters!
router.route("/").post(createPlaylist);

// 3. SECURED VIDEO MEMBER TOGGLES
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

// 4. MIXED DYNAMIC LOOKUPS & MUTATIONS (Keep these at the bottom!)
router.route("/:playlistId")
    .get(getPlaylistById) // Accessible to verify optional state downstream
    .patch(updatePlaylist)
    .delete(deletePlaylist);

export default router;