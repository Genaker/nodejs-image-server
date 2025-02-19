// 📌 imageProcessor.ts
import sharp from "sharp";
import path from "path";
import fs from "fs-extra";

/**
 * Processes an image using sharp.
 * @param originalFilePath - The path to the original image.
 * @param processedFilePath - The path where the processed image should be saved.
 * @param format - Name of decoder used to decompress image data e.g. jpeg, png, webp, gif, svg
 * @param quality - The image quality (1-100).
 * @param width - The target width.
 * @param height - The target height.
 * @param aspect - The aspect ratio ("keep" or "stretch").
 * @returns Promise<string> - The processed file path.
 */
export async function processImage(
    originalFilePath: string,
    processedFilePath: string,
    format: string,
    quality: number,
    width: number | null | undefined,   // ✅ Allow null/undefined
    height: number | null | undefined,  // ✅ Allow null/undefined
    aspect: string
): Promise<string> {
    try {
        let image = sharp(originalFilePath);

        // Ensure `width` and `height` are numbers or undefined
        const widthNum = width !== null ? Number(width) || undefined : undefined;
        const heightNum = height !== null ? Number(height) || undefined : undefined;

        // Resize image based on aspect ratio
        if (widthNum || heightNum) {
            if (aspect === "keep") {
                image = image.resize({ width: widthNum, height: heightNum, fit: "inside" });
            } else {
                image = image.resize(widthNum, heightNum);
            }
        }

        /*
        When both a width and height are provided, the possible methods by which the image should fit these are:
        cover: (default) Preserving aspect ratio, attempt to ensure the image covers both provided dimensions by cropping/clipping to fit.
        contain: Preserving aspect ratio, contain within both provided dimensions using "letterboxing" where necessary.
        fill: Ignore the aspect ratio of the input and stretch to both provided dimensions.
        inside: Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified.
        outside: Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified.  
        */

        // Convert & Save Processed Image
        const qualityNum = quality !== null ? Number(quality) || undefined : undefined;
        await image.toFormat(format as keyof sharp.FormatEnum, { quality: qualityNum }).toFile(processedFilePath);

        console.log(`✅ Processed & Saved: ${processedFilePath}`);
        return processedFilePath;
    } catch (err) {
        console.error("❌ Error processing image:", err);
        throw new Error("Error processing image.");
    }
}
