import { S3Client, PutObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const S3_ENABLED = process.env.AWS_ENABLE_S3 === "true";

if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
    console.warn("⚠️  AWS S3 environment variables are not set. S3 uploads may not work.");
}

// Configure AWS S3 client only if enabled
const s3 = S3_ENABLED
    ? new S3Client({
          region: process.env.AWS_REGION as string,
          credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
          },
      })
    : null;

/**
 * Uploads a file to AWS S3 if S3 is enabled.
 * @param filePath - The local file path.
 * @param fileName - The destination file name in S3.
 * @returns The S3 URL of the uploaded file, or null if S3 is disabled or an error occurs.
 */
export const uploadToS3 = async (filePath: string, fileName: string): Promise<string | null> => {
    if (!S3_ENABLED || !s3) {
        console.warn("S3 is disabled. Skipping upload.");
        return null;
    }

    try {
        // Read the file from the local file system
        const fileContent = await fs.readFile(filePath);

        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET as string,
            Key: `processed_images/${fileName}`,
            Body: fileContent,
            ContentType: "image/jpeg",
            ACL: ObjectCannedACL.public_read, // ✅ Fix: Use correct lowercase enum
        };

        console.log(`🚀 Uploading ${fileName} to S3 bucket ${uploadParams.Bucket}...`);

        await s3.send(new PutObjectCommand(uploadParams));

        const fileUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        console.log(`✅ Successfully uploaded to S3: ${fileUrl}`);

        return fileUrl;
    } catch (error) {
        console.error("❌ S3 Upload Error:", error);
        return null;
    }
};
