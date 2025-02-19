"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_extra_1 = __importDefault(require("fs-extra"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const S3_ENABLED = process.env.AWS_ENABLE_S3 === "true";
if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
    console.warn("⚠️  AWS S3 environment variables are not set. S3 uploads may not work.");
}
// Configure AWS S3 client only if enabled
const s3 = S3_ENABLED
    ? new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    })
    : null;
/**
 * Uploads a file to AWS S3 if S3 is enabled.
 * @param filePath - The local file path.
 * @param fileName - The destination file name in S3.
 * @returns The S3 URL of the uploaded file, or null if S3 is disabled or an error occurs.
 */
const uploadToS3 = (filePath, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    if (!S3_ENABLED || !s3) {
        console.warn("S3 is disabled. Skipping upload.");
        return null;
    }
    try {
        // Read the file from the local file system
        const fileContent = yield fs_extra_1.default.readFile(filePath);
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `processed_images/${fileName}`,
            Body: fileContent,
            ContentType: "image/jpeg",
            ACL: client_s3_1.ObjectCannedACL.public_read, // ✅ Fix: Use correct lowercase enum
        };
        console.log(`🚀 Uploading ${fileName} to S3 bucket ${uploadParams.Bucket}...`);
        yield s3.send(new client_s3_1.PutObjectCommand(uploadParams));
        const fileUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        console.log(`✅ Successfully uploaded to S3: ${fileUrl}`);
        return fileUrl;
    }
    catch (error) {
        console.error("❌ S3 Upload Error:", error);
        return null;
    }
});
exports.uploadToS3 = uploadToS3;
