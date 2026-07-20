import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


import { ApiError } from "./utils/ApiError.js";

const app = express();

// Set up Cross-Origin Resource Sharing so our React frontend can talk to our API
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Common middlewares configuration
app.use(express.json({ limit: "16kb" })); // Parse incoming JSON payloads
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Parse URL-encoded strings (form fields)
app.use(cookieParser()); // Read/Write secure HTTP-only user session cookies


// --- DECLARE ROUTE PATHS HERE ---
// This mounts user paths under the standardized versioned path /api/v1/users

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";

app.use("/api/v1/users", userRouter);

app.use("/api/v1/videos", videoRouter);


app.use("/api/v1/likes", likeRouter);

app.use("/api/v1/comments", commentRouter);

app.use("/api/v1/subscriptions", subscriptionRouter);

app.use("/api/v1/playlists", playlistRouter);



// Centralized Global Error Handling Middleware
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors
        });
    }

    // Catch-all for unexpected software failures
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

export { app };