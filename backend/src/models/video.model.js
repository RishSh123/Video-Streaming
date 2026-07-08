import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
    {
        videoUrl: {
            type: String, // Will hold the ImageKit HLS master playlist URL (.m3u8)
            required: true
        },
        thumbnailUrl: {
            type: String, // Will hold the ImageKit processed image URL
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number, // In seconds (extracted during upload tracking)
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        category: {
            type: String,
            required: true,
            index: true
        },
        tags: [
            {
                type: String,
                trim: true
            }
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Video = mongoose.model("Video", videoSchema);