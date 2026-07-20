import { Router } from "express";
import { 
    getVideoComments, 
    addComment, 
    updateComment, 
    deleteComment 
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// PUBLIC: Allowed for logged-out users to read discussion logs
router.route("/v/:videoId").get(getVideoComments);

// PROTECTED LAYER: Everything below this line forces authentication
router.use(verifyJWT);

router.route("/v/:videoId").post(addComment);
router.route("/c/:commentId")
    .patch(updateComment)
    .delete(deleteComment);

export default router;