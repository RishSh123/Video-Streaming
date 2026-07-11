import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// 1. GET ALL COMMENTS FOR A VIDEO (With Pagination & Like Counts)
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video identifier format");
    }

    // Verify video exists before running pipeline
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video track not found");
    }

    // Construct an aggregation pipeline to fetch comments, join owner info, and count likes
    const commentsAggregation = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        // Join user profile details for comment authors
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "author",
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
        // Join Likes collection to find how many likes this comment has accumulated
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                author: { $first: "$author" },
                likesCount: { $size: "$likes" }
            }
        },
        {
            $project: {
                likes: 0 // Remove raw array to keep payload lightweight
            }
        },
        {
            $sort: { createdAt: -1 } // Chronological stream: newest responses first
        }
    ]);

    // Execute paginated queries using our aggregated pipeline engine
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const paginatedComments = await Comment.aggregatePaginate(commentsAggregation, options);

    return res
        .status(200)
        .json(new ApiResponse(200, paginatedComments, "Comments timeline fetched successfully"));
});

// 2. ADD A NEW COMMENT TO A VIDEO
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment text content cannot be empty");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video identifier format");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Target video track not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment published successfully"));
});

// 3. UPDATE AN EXISTING COMMENT
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment record not found");
    }

    // Security Gate: Ensure the user owns this comment
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You lack structural authorization to edit this comment");
    }

    comment.content = content;
    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment modified successfully"));
});

// 4. DELETE A COMMENT
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment record not found");
    }

    // Security Gate: Ensure the user owns this comment
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You lack structural authorization to remove this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment purged from record successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};