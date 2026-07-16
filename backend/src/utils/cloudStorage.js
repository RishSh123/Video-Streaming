import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

// Point fluent-ffmpeg directly to the static package binaries
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
import { S3Client, PutObjectCommand,DeleteObjectCommand } from "@aws-sdk/client-s3";
import ImageKit from "imagekit";
import fs from "fs";
import path from "path";


// 1. Initialize AWS S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// 2. Initialize ImageKit Client
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const getLocalVideoDuration = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            // Extract precise duration length in seconds
            const duration = metadata?.format?.duration;
            resolve(duration ? Math.round(duration) : 0);
        });
    });
};

/**
 * Uploads a local file (like an avatar or thumbnail) directly to ImageKit Media Library
 */
export const uploadToImageKit = async (localFilePath, folder = "/general") => {
    try {
        if (!localFilePath) return null;

        // Read local file into a buffer
        const fileBuffer = fs.readFileSync(localFilePath);
        const fileName = path.basename(localFilePath);

        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: fileName,
            folder: folder,
        });

        // Remove file from local public/temp storage
        fs.unlinkSync(localFilePath);
        return response.url; // Returns clean direct optimized asset URL
    } catch (error) {
        // Safe fallback: clean up local temp space even if cloud upload crashed
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        console.error("ImageKit Upload Error:", error);
        return null;
    }
};



/**
 * Uploads a heavy raw MP4 video directly to private AWS S3, 
 * and returns the structured ImageKit HLS adaptive streaming URL.
 */
export const uploadVideoToCloudPipeline = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // 1. Automatically calculate the duration BEFORE uploading or unlinking the file
        const duration = await getLocalVideoDuration(localFilePath);

        const fileStream = fs.createReadStream(localFilePath);
        const uniqueFileName = `${Date.now()}-${path.basename(localFilePath)}`;

        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: uniqueFileName,
            Body: fileStream,
            ContentType: "video/mp4",
        };

        // Transfer raw video over to AWS
        await s3Client.send(new PutObjectCommand(uploadParams));

        // Clean up our local storage node
        fs.unlinkSync(localFilePath);

        // Clean the base URL endpoint from your environment config
        const cleanEndpoint = process.env.IMAGEKIT_URL_ENDPOINT.replace(/\/$/, "");

        // 1. Construct the path pointing directly to the video filename
        // 2. Append the required manifest file and resolution transformation query exactly per the guide
        const hlsStreamingUrl = `${cleanEndpoint}/${uniqueFileName}/ik-master.m3u8?tr=sr-360_480_720_1080`;

        // Return both properties back to your controller wrapper block
        return {
            videoUrl: hlsStreamingUrl,
            duration: duration
        };
        
    } catch (error) {
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        console.error("AWS S3 Video Pipeline Error:", error);
        return null;
    }
};
/**
 * Deletes an object from the private AWS S3 bucket
 */
export const deleteFromS3 = async (fileKey) => {
    try {
        if (!fileKey) return;
        
        await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey
        }));
    } catch (error) {
        console.error("Failed to delete video asset from S3:", error);
    }
};

/**
 * Deletes a file from the ImageKit Media Library using its URL or file ID
 * (ImageKit allows searching and deleting by filename/path easily)
 */
/**
 * Deletes a file from the ImageKit Media Library using its exact name
 */
export const deleteFromImageKit = async (fileUrl) => {
    try {
        if (!fileUrl) return;

        // Extract the filename from the URL (the last part after the slash)
        // E.g., https://ik.imagekit.io/id/thumbnails/123-pic.jpg -> 123-pic.jpg
        const fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

        // Search for the file using the exact fileName parameter
        const files = await imagekit.listFiles({
            searchQuery: `name = "${fileName}"`
        });

        // If found, target the explicit unique asset fileId for absolute deletion
        if (files && files.length > 0) {
            await imagekit.deleteFile(files[0].fileId);
            console.log(`Successfully purged thumbnail from ImageKit: ${fileName}`);
        } else {
            console.log(`Thumbnail not found in ImageKit search: ${fileName}`);
        }
    } catch (error) {
        console.error("Failed to delete thumbnail asset from ImageKit:", error);
    }
};