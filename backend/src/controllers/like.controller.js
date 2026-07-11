import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. TOGGLE LIKE ON A VIDEO
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video identifier format");
    }

    // Check if the user has already liked this video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    });

    if (existingLike) {
        // User already liked it -> Unlike it (Remove record)
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Video unliked successfully"));
    }

    // User hasn't liked it -> Create new like record
    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Video liked successfully"));
});

// 2. TOGGLE LIKE ON A COMMENT
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment identifier format");
    }

    // Check if the user has already liked this comment
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    });

    if (existingLike) {
        // Unlike comment
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Comment unliked successfully"));
    }

    // Like comment
    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { isLiked: true }, "Comment liked successfully"));
});

// 3. FETCH ALL VIDEOS LIKED BY CURRENT LOGGED-IN USER
const getLikedVideos = asyncHandler(async (req, res) => {
    // We run an aggregation pipeline to find all likes by this user and join the video metadata
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true } // Ensure we only grab video likes, not comment likes
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$ownerDetails" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: { $first: "$videoDetails" }
            }
        },
        {
            $match: {
                "video.isPublished": true // Security: hide any videos that were made private later
            }
        },
        {
            $project: {
                _id: 1,
                video: 1,
                createdAt: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos list retrieved successfully"));
});

export {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos
};