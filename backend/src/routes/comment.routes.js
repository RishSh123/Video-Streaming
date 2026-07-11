import { Router } from "express";
import { getVideoComments, addComment, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Individual Video Route Scopes (Mixed public reads, verified sessions for additions)
router.route("/v/:videoId")
    .get(getVideoComments)
    .post(verifyJWT, addComment);

// Document Modification Scopes (Requires active session verification)
router.route("/c/:commentId")
    .patch(verifyJWT, updateComment)
    .delete(verifyJWT, deleteComment);

export default router;