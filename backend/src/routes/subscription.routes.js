import { Router } from "express";
import { 
    toggleSubscription, 
    getUserChannelSubscribers, 
    getSubscribedChannels 
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// PUBLIC: Logged-out users can view who subscribes to a public creator channel
router.route("/c/:channelId").get(getUserChannelSubscribers);

// PROTECTED LAYER: Managing user follows is strictly locked down
router.use(verifyJWT);

router.route("/c/:channelId").post(toggleSubscription);
router.route("/u/:subscriberId").get(getSubscribedChannels); // Private follow index tracking

export default router;