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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
//import express, { Request, Response, NextFunction } from "express";
const fastify_1 = __importDefault(require("fastify"));
const static_1 = __importDefault(require("@fastify/static"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const node_cron_1 = __importDefault(require("node-cron"));
const dotenv_1 = __importDefault(require("dotenv"));
const imageProcessor_1 = require("./imageProcessor");
dotenv_1.default.config();
console.log("Server DIR: " + __dirname);
var fileExistsCache = [];
const ENCRYPT = (_a = process.env.ENCRYPT) !== null && _a !== void 0 ? _a : "";
const MEDIA_URL = (_b = process.env.MEDIA_URL) !== null && _b !== void 0 ? _b : "/media/2/*";
const FULL_BASE64_URI = (_c = process.env.FULL_BASE64_URI) !== null && _c !== void 0 ? _c : false;
var MAGENTO_URI = getEnvBoolean('MAGENTO_URI', true);
// const app = express();
const fastify = (0, fastify_1.default)({ logger: true });
// Example Route
fastify.get("/", (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
    return { message: "Fastify Image Server!" };
}));
const SOURCE_DIR = path_1.default.join(__dirname, "../../pub/media");
const OUTPUT_DIR = path_1.default.join(__dirname, "../compressed_images");
// Register `fastify-static`
fastify.register(static_1.default, {
    root: OUTPUT_DIR, // Serve static files from the output directory
    prefix: "/compressed-images/", // Optional: Access via `/compressed-images/filename.jpg`
});
// Global 404 Handler
fastify.setNotFoundHandler((request, reply) => {
    console.log(`❌ 404 Not Found: ${request.url}`);
    reply.status(404).send({
        error: "Not Found",
        message: `The requested URL '${request.url}' was not found on this server.`,
    });
});
//app.use(express.json());
//const OUTPUT_DIR = path.join(__dirname, "../compressed_images");
const AUTO_DELETE_AFTER = parseInt(process.env.AUTO_DELETE_AFTER || "36000"); // 1 hour
// Ensure output directory exists
if (!fs_extra_1.default.existsSync(OUTPUT_DIR)) {
    fs_extra_1.default.mkdirSync(OUTPUT_DIR, { recursive: true });
}
// Function to validate image format
const isValidFormat = (format) => ["jpg", "webp"].includes(format.toLowerCase());
// Function to check if a string is a valid URL
const isValidUrl = (str) => {
    try {
        new URL(str);
        return true;
    }
    catch (e) {
        return false;
    }
};
const downloadImage = (url, dest) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`📥 Downloading image from: ${url}`);
    const response = yield fetch(url); // Native fetch (No need for node-fetch)
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    // Convert arrayBuffer() to Buffer
    const buffer = Buffer.from(yield response.arrayBuffer());
    yield fs_extra_1.default.writeFile(dest, buffer);
    console.log(`✅ Image downloaded and saved to: ${dest}`);
    return dest;
});
// Fastify Main Media Route
fastify.get(MEDIA_URL, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    console.time("Request Processing");
    console.log("GET file router");
    // /media/2/Y/Y2F0YWxvZy9wcm9kdWN0L3cvYi93YjA0LWJsdWUtMC5qcGc-f_webp-q_60-w_805-h_806-a_keep
    // /path/fitst letter as a folder/ BAse 64 of the magento original or other image url-f_format-q_quality-w_width-h_height-a_aspect
    let filePathOrUrl = req.params["*"];
    let fileParams;
    let fileBase64;
    let originalPath;
    let magentoImagePath;
    if (MAGENTO_URI) {
        magentoImagePath = filePathOrUrl;
        filePathOrUrl = filePathOrUrl;
        originalPath = filePathOrUrl;
    }
    else if (filePathOrUrl) {
        let splitPath = filePathOrUrl.split("/");
        let tempPath;
        if (splitPath[0].length === 1) {
            tempPath = splitPath[1];
        }
        else {
            tempPath = splitPath[0];
        }
        originalPath = tempPath.replace('.jpg', '');
        if (FULL_BASE64_URI !== false) {
            originalPath = decodeBase64ToPath(filePathOrUrl);
        }
        if (ENCRYPT) {
        }
        // TODO: add full base 64
        splitPath = tempPath.split("-");
        filePathOrUrl = splitPath[0];
        fileBase64 = filePathOrUrl;
        if (!FULL_BASE64_URI) {
            fileBase64 = decodeBase64ToPath(filePathOrUrl);
        }
        filePathOrUrl = decodeURIComponent(fileBase64);
        fileParams = splitPath.slice(1).join("-");
    }
    else {
        filePathOrUrl = req.query.format;
    }
    // Determine if it's a URL or Local File
    const isUrl = filePathOrUrl === null || filePathOrUrl === void 0 ? void 0 : filePathOrUrl.startsWith("http");
    const isLocalFile = !isUrl && filePathOrUrl;
    if (!filePathOrUrl || !originalPath) {
        res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
        return res.status(400).send({ error: "Invalid or missing file path." });
    }
    // Extract & Parse Image Transformation Parameters
    var { format, quality, width, height, aspect } = parseImageParams(req, fileParams);
    format = (_a = req.query['format']) !== null && _a !== void 0 ? _a : format;
    quality = parseInt((_b = req.query['quality']) !== null && _b !== void 0 ? _b : quality);
    width = parseInt((_c = req.query['width']) !== null && _c !== void 0 ? _c : width);
    height = parseInt((_d = req.query['height']) !== null && _d !== void 0 ? _d : height);
    aspect = (_e = req.query['aspect']) !== null && _e !== void 0 ? _e : aspect;
    console.log(`📥 Processing Image: ${filePathOrUrl} | Format: ${format}, Quality: ${quality}, Width: ${width}, Height: ${height}, Aspect: ${aspect}`);
    const filename = isUrl ? path_1.default.basename(new URL(filePathOrUrl).pathname) : path_1.default.basename(filePathOrUrl);
    const originalFilePath = isLocalFile ? path_1.default.resolve(SOURCE_DIR, filePathOrUrl) : path_1.default.join(SOURCE_DIR, filename);
    let processedFilePath = "";
    if (MAGENTO_URI === true) {
        let fileName = (_f = originalPath.split('/').pop()) !== null && _f !== void 0 ? _f : "";
        let imageDir = originalPath.replace(fileName, "");
        let dir = OUTPUT_DIR + '/' + imageDir;
        // Ensure output directory exists
        if (!fs_extra_1.default.existsSync(dir)) {
            fs_extra_1.default.mkdirSync(dir, { recursive: true });
        }
        let paramPath = '-f_' + format + '-q_' + quality + '-w_' + width + '-h_' + height + '-a_' + aspect;
        processedFilePath = dir + fileName.replace('.jpg', '') + paramPath + '.jpg';
    }
    else {
        let dir = OUTPUT_DIR + '/' + originalPath[0];
        if (!fs_extra_1.default.existsSync(dir)) {
            fs_extra_1.default.mkdirSync(dir, { recursive: true });
        }
        processedFilePath = dir + '/' + originalPath + '.jpg';
    }
    console.timeEnd("Request Processing");
    // Check if Processed File Exists (Cache)
    if (fileExistsCache[processedFilePath] || (yield fs_extra_1.default.exists(processedFilePath))) {
        if (!fileExistsCache[processedFilePath]) {
            fileExistsCache[processedFilePath] = true;
        }
        let processedImageBuffer;
        try {
            processedImageBuffer = yield fs_extra_1.default.readFile(processedFilePath);
            console.log(`✅ Returning cached image: ${processedFilePath}`);
        }
        catch (error) {
            // Sometimse some issues with the cache 
            if (yield fs_extra_1.default.exists(processedFilePath)) {
                fileExistsCache[processedFilePath] = true;
                processedImageBuffer = yield fs_extra_1.default.readFile(processedFilePath);
            }
            else {
                throw new Error(`File not found: ${processedFilePath}`);
            }
        }
        return res.type(`image/${format}`).send(processedImageBuffer);
    }
    // Handle Local File Processing
    if (isLocalFile) {
        if (!(yield fs_extra_1.default.exists(originalFilePath))) {
            res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            res.header("Pragma", "no-cache");
            res.header("Expires", "0");
            return res.status(404).send({ error: "Local file not found." });
        }
    }
    else {
        // ✅ Download Image If Not Available Locally
        if (!(yield fs_extra_1.default.exists(originalFilePath))) {
            try {
                yield downloadImage(filePathOrUrl, originalFilePath);
            }
            catch (error) {
                res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
                res.header("Pragma", "no-cache");
                res.header("Expires", "0");
                return res.status(500).send({ error: "Failed to download image from URL." });
            }
        }
    }
    try {
        console.time("Proces Image File");
        // Process Image (Local or Downloaded)
        const processedImageFile = yield (0, imageProcessor_1.processImage)(originalFilePath, processedFilePath, format, quality, width, height, aspect);
        const processedImageBuffer = yield fs_extra_1.default.readFile(processedImageFile);
        // await fs.writeFile(processedFilePath, processedImageBuffer);
        // return res.sendFile(processedImageFile);
        console.timeEnd("Proces Image File");
        return res.type(`image/${format}`).send(processedImageBuffer);
    }
    catch (error) {
        res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
        console.error("❌ Image Processing Error:", error);
        res.status(500).send({ error: "Failed to process image." });
    }
}));
// **Scheduled Job: Auto-delete Old Images**
node_cron_1.default.schedule("* 2 */10 * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🗑 Running cleanup task...");
    const files = yield fs_extra_1.default.readdir(OUTPUT_DIR);
    const now = Date.now();
    for (const file of files) {
        const filePath = path_1.default.join(OUTPUT_DIR, file);
        const stats = yield fs_extra_1.default.stat(filePath);
        if (now - stats.mtimeMs > AUTO_DELETE_AFTER * 1000) {
            yield fs_extra_1.default.unlink(filePath);
            console.log(`🗑 Deleted old file: ${filePath}`);
        }
    }
}));
function parseImageParams(req, fileParams) {
    const defaultParams = { format: "webp", quality: 70, width: 120, height: 120, aspect: "stretch" };
    const paramMatches = Object.assign({}, defaultParams);
    if (fileParams) {
        const regex = /([fqhwa])_([^-]+)/g;
        let match;
        while ((match = regex.exec(fileParams)) !== null) {
            const key = match[1];
            const value = match[2];
            switch (key) {
                case "f":
                    paramMatches.format = value;
                    break;
                case "q":
                    paramMatches.quality = parseInt(value, 10) || 80;
                    break;
                case "w":
                    paramMatches.width = parseInt(value, 10) || defaultParams.width;
                    break;
                case "h":
                    paramMatches.height = parseInt(value, 10) || defaultParams.height;
                    break;
                case "a":
                    paramMatches.aspect = value;
                    break;
            }
        }
    }
    else {
        // Fix: Explicitly cast `req.query` as `GetFileQuery`
        const query = req.query;
        paramMatches.format = query.format || defaultParams.format;
        paramMatches.quality = query.quality ? parseInt(query.quality, 10) || 80 : 80;
        paramMatches.width = query.width ? parseInt(query.width, 10) : defaultParams.width;
        paramMatches.height = query.height ? parseInt(query.height, 10) : defaultParams.height;
        paramMatches.aspect = query.aspect || "stretch";
    }
    return paramMatches;
}
/**
 * Decodes a Base64 string back to a file path.
 * @param {string} base64String - The Base64 encoded path.
 * @returns {string} - The decoded file path.
 */
function decodeBase64ToPath(base64String) {
    return Buffer.from(base64String, "base64").toString("utf-8");
}
function getEnvBoolean(key, defaultValue = true) {
    var _a, _b;
    return ((_a = process.env[key]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "true"
        ? true
        : ((_b = process.env[key]) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "false"
            ? false
            : defaultValue;
}
;
// Start the server
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// Start the Server
const PORT = 8080;
fastify.listen({ port: PORT }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`🚀 Fastify server running at ${address}`);
});
