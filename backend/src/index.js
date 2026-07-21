import dotenv from "dotenv";

dotenv.config({
    path: "./.env"
});

import connectDB from "./config/db.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        // 1. Capture the HTTP server instance
        const server = app.listen(PORT, () => {
            console.log(`⚙️  Server is running on port : ${PORT}`);
        });

        // 2. Increase server timeout to 10 minutes (600,000 milliseconds) for large uploads
        server.timeout = 10 * 60 * 1000;
    })
    .catch((err) => {
        console.log("MongoDB connection failed !!! ", err);
    });