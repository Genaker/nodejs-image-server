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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.processImage = void 0;
// 📌 imageProcessor.ts
var sharp_1 = require("sharp");
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
    return __awaiter(this, void 0, void 0, function () {
        var image, widthNum, heightNum, qualityNum, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    image = (0, sharp_1["default"])(originalFilePath);
                    widthNum = width !== null ? Number(width) || undefined : undefined;
                    heightNum = height !== null ? Number(height) || undefined : undefined;
                    // Resize image based on aspect ratio
                    if (widthNum || heightNum) {
                        if (aspect === "keep") {
                            image = image.resize({ width: widthNum, height: heightNum, fit: "inside" });
                        }
                        else {
                            image = image.resize(widthNum, heightNum);
                        }
                    }
                    qualityNum = quality !== null ? Number(quality) || undefined : undefined;
                    return [4 /*yield*/, image.toFormat(format, { quality: qualityNum }).toFile(processedFilePath)];
                case 1:
                    _a.sent();
                    console.log("\u2705 Processed & Saved: ".concat(processedFilePath));
                    return [2 /*return*/, processedFilePath];
                case 2:
                    err_1 = _a.sent();
                    console.error("❌ Error processing image:", err_1);
                    throw new Error("Error processing image.");
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.processImage = processImage;
