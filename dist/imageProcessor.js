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
exports.processImage = processImage;
// 📌 imageProcessor.ts
const sharp_1 = __importDefault(require("sharp"));
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
function processImage(originalFilePath, processedFilePath, format, quality, width, // ✅ Allow null/undefined
height, // ✅ Allow null/undefined
aspect) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let image = (0, sharp_1.default)(originalFilePath);
            // Ensure `width` and `height` are numbers or undefined
            const widthNum = width !== null ? Number(width) || undefined : undefined;
            const heightNum = height !== null ? Number(height) || undefined : undefined;
            // Resize image based on aspect ratio
            if (widthNum || heightNum) {
                if (aspect === "keep") {
                    image = image.resize({ width: widthNum, height: heightNum, fit: "inside" });
                }
                else {
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
            yield image.toFormat(format, { quality: qualityNum }).toFile(processedFilePath);
            console.log(`✅ Processed & Saved: ${processedFilePath}`);
            return processedFilePath;
        }
        catch (err) {
            console.error("❌ Error processing image:", err);
            throw new Error("Error processing image.");
        }
    });
}
