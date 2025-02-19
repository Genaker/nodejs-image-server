"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var _a, _b, _c;
exports.__esModule = true;
//import express, { Request, Response, NextFunction } from "express";
var fastify_1 = require("fastify");
var static_1 = require("@fastify/static");
var fs_extra_1 = require("fs-extra");
var path_1 = require("path");
var node_cron_1 = require("node-cron");
var dotenv_1 = require("dotenv");
var imageProcessor_1 = require("./imageProcessor");
dotenv_1["default"].config();
console.log("Server DIR: " + __dirname);
var fileExistsCache = [];
var ENCRYPT = (_a = process.env.ENCRYPT) !== null && _a !== void 0 ? _a : "";
var MEDIA_URL = (_b = process.env.MEDIA_URL) !== null && _b !== void 0 ? _b : "/media/2/*";
var FULL_BASE64_URI = (_c = process.env.FULL_BASE64_URI) !== null && _c !== void 0 ? _c : false;
var MAGENTO_URI = getEnvBoolean('MAGENTO_URI', true);
// const app = express();
var fastify = (0, fastify_1["default"])({ logger: true });
// Example Route
fastify.get("/", function (request, reply) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, { message: "Fastify Image Server!" }];
    });
}); });
var SOURCE_DIR = path_1["default"].join(__dirname, "../../pub/media");
var OUTPUT_DIR = path_1["default"].join(__dirname, "../compressed_images");
// Register `fastify-static`
fastify.register(static_1["default"], {
    root: OUTPUT_DIR,
    prefix: "/compressed-images/"
});
// Global 404 Handler
fastify.setNotFoundHandler(function (request, reply) {
    console.log("\u274C 404 Not Found: ".concat(request.url));
    reply.status(404).send({
        error: "Not Found",
        message: "The requested URL '".concat(request.url, "' was not found on this server.")
    });
});
//app.use(express.json());
//const OUTPUT_DIR = path.join(__dirname, "../compressed_images");
var AUTO_DELETE_AFTER = parseInt(process.env.AUTO_DELETE_AFTER || "36000"); // 1 hour
// Ensure output directory exists
if (!fs_extra_1["default"].existsSync(OUTPUT_DIR)) {
    fs_extra_1["default"].mkdirSync(OUTPUT_DIR, { recursive: true });
}
// Function to validate image format
var isValidFormat = function (format) { return ["jpg", "webp"].includes(format.toLowerCase()); };
// Function to check if a string is a valid URL
var isValidUrl = function (str) {
    try {
        new URL(str);
        return true;
    }
    catch (e) {
        return false;
    }
};
var downloadImage = function (url, dest) { return __awaiter(void 0, void 0, void 0, function () {
    var response, buffer, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log("\uD83D\uDCE5 Downloading image from: ".concat(url));
                return [4 /*yield*/, fetch(url)];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    throw new Error("Failed to fetch image: ".concat(response.statusText));
                }
                _b = (_a = Buffer).from;
                return [4 /*yield*/, response.arrayBuffer()];
            case 2:
                buffer = _b.apply(_a, [_c.sent()]);
                return [4 /*yield*/, fs_extra_1["default"].writeFile(dest, buffer)];
            case 3:
                _c.sent();
                console.log("\u2705 Image downloaded and saved to: ".concat(dest));
                return [2 /*return*/, dest];
        }
    });
}); };
// Fastify Main Media Route
fastify.get(MEDIA_URL, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var filePathOrUrl, fileParams, fileBase64, originalPath, magentoImagePath, splitPath, tempPath, isUrl, isLocalFile, _a, format, quality, width, height, aspect, filename, originalFilePath, processedFilePath, fileName, imageDir, dir, paramPath, dir, _b, processedImageBuffer, error_1, processedImageFile, processedImageBuffer, error_2;
    var _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                console.time("Request Processing");
                console.log("GET file router");
                filePathOrUrl = req.params["*"];
                if (MAGENTO_URI) {
                    magentoImagePath = filePathOrUrl;
                    filePathOrUrl = filePathOrUrl;
                    originalPath = filePathOrUrl;
                }
                else if (filePathOrUrl) {
                    splitPath = filePathOrUrl.split("/");
                    tempPath = void 0;
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
                isUrl = filePathOrUrl === null || filePathOrUrl === void 0 ? void 0 : filePathOrUrl.startsWith("http");
                isLocalFile = !isUrl && filePathOrUrl;
                if (!filePathOrUrl || !originalPath) {
                    res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
                    res.header("Pragma", "no-cache");
                    res.header("Expires", "0");
                    return [2 /*return*/, res.status(400).send({ error: "Invalid or missing file path." })];
                }
                _a = parseImageParams(req, fileParams), format = _a.format, quality = _a.quality, width = _a.width, height = _a.height, aspect = _a.aspect;
                format = (_c = req.query['format']) !== null && _c !== void 0 ? _c : format;
                quality = parseInt((_d = req.query['quality']) !== null && _d !== void 0 ? _d : quality);
                width = parseInt((_e = req.query['width']) !== null && _e !== void 0 ? _e : width);
                height = parseInt((_f = req.query['height']) !== null && _f !== void 0 ? _f : height);
                aspect = (_g = req.query['aspect']) !== null && _g !== void 0 ? _g : aspect;
                console.log("\uD83D\uDCE5 Processing Image: ".concat(filePathOrUrl, " | Format: ").concat(format, ", Quality: ").concat(quality, ", Width: ").concat(width, ", Height: ").concat(height, ", Aspect: ").concat(aspect));
                filename = isUrl ? path_1["default"].basename(new URL(filePathOrUrl).pathname) : path_1["default"].basename(filePathOrUrl);
                originalFilePath = isLocalFile ? path_1["default"].resolve(SOURCE_DIR, filePathOrUrl) : path_1["default"].join(SOURCE_DIR, filename);
                processedFilePath = "";
                if (MAGENTO_URI === true) {
                    fileName = (_h = originalPath.split('/').pop()) !== null && _h !== void 0 ? _h : "";
                    imageDir = originalPath.replace(fileName, "");
                    dir = OUTPUT_DIR + '/' + imageDir;
                    // Ensure output directory exists
                    if (!fs_extra_1["default"].existsSync(dir)) {
                        fs_extra_1["default"].mkdirSync(dir, { recursive: true });
                    }
                    paramPath = '-f_' + format + '-q_' + quality + '-w_' + width + '-h_' + height + '-a_' + aspect;
                    processedFilePath = dir + fileName.replace('.jpg', '') + paramPath + '.jpg';
                }
                else {
                    dir = OUTPUT_DIR + '/' + originalPath[0];
                    if (!fs_extra_1["default"].existsSync(dir)) {
                        fs_extra_1["default"].mkdirSync(dir, { recursive: true });
                    }
                    processedFilePath = dir + '/' + originalPath + '.jpg';
                }
                console.timeEnd("Request Processing");
                _b = fileExistsCache[processedFilePath];
                if (_b) return [3 /*break*/, 2];
                return [4 /*yield*/, fs_extra_1["default"].exists(processedFilePath)];
            case 1:
                _b = (_j.sent());
                _j.label = 2;
            case 2:
                if (!_b) return [3 /*break*/, 4];
                if (!fileExistsCache[processedFilePath]) {
                    fileExistsCache[processedFilePath] = true;
                }
                console.time("Static File");
                console.log("\u2705 Returning cached image: ".concat(processedFilePath));
                return [4 /*yield*/, fs_extra_1["default"].readFile(processedFilePath)];
            case 3:
                processedImageBuffer = _j.sent();
                console.timeEnd("Static File");
                return [2 /*return*/, res.type("image/".concat(format)).send(processedImageBuffer)];
            case 4:
                if (!isLocalFile) return [3 /*break*/, 6];
                return [4 /*yield*/, fs_extra_1["default"].exists(originalFilePath)];
            case 5:
                if (!(_j.sent())) {
                    res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
                    res.header("Pragma", "no-cache");
                    res.header("Expires", "0");
                    return [2 /*return*/, res.status(404).send({ error: "Local file not found." })];
                }
                return [3 /*break*/, 11];
            case 6: return [4 /*yield*/, fs_extra_1["default"].exists(originalFilePath)];
            case 7:
                if (!!(_j.sent())) return [3 /*break*/, 11];
                _j.label = 8;
            case 8:
                _j.trys.push([8, 10, , 11]);
                return [4 /*yield*/, downloadImage(filePathOrUrl, originalFilePath)];
            case 9:
                _j.sent();
                return [3 /*break*/, 11];
            case 10:
                error_1 = _j.sent();
                res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
                res.header("Pragma", "no-cache");
                res.header("Expires", "0");
                return [2 /*return*/, res.status(500).send({ error: "Failed to download image from URL." })];
            case 11:
                _j.trys.push([11, 14, , 15]);
                console.time("Proces Image File");
                return [4 /*yield*/, (0, imageProcessor_1.processImage)(originalFilePath, processedFilePath, format, quality, width, height, aspect)];
            case 12:
                processedImageFile = _j.sent();
                return [4 /*yield*/, fs_extra_1["default"].readFile(processedImageFile)];
            case 13:
                processedImageBuffer = _j.sent();
                // await fs.writeFile(processedFilePath, processedImageBuffer);
                // return res.sendFile(processedImageFile);
                console.timeEnd("Proces Image File");
                return [2 /*return*/, res.type("image/".concat(format)).send(processedImageBuffer)];
            case 14:
                error_2 = _j.sent();
                res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
                res.header("Pragma", "no-cache");
                res.header("Expires", "0");
                console.error("❌ Image Processing Error:", error_2);
                res.status(500).send({ error: "Failed to process image." });
                return [3 /*break*/, 15];
            case 15: return [2 /*return*/];
        }
    });
}); });
// **Scheduled Job: Auto-delete Old Images**
node_cron_1["default"].schedule("* 2 */10 * *", function () { return __awaiter(void 0, void 0, void 0, function () {
    var files, now, _i, files_1, file, filePath, stats;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("🗑 Running cleanup task...");
                return [4 /*yield*/, fs_extra_1["default"].readdir(OUTPUT_DIR)];
            case 1:
                files = _a.sent();
                now = Date.now();
                _i = 0, files_1 = files;
                _a.label = 2;
            case 2:
                if (!(_i < files_1.length)) return [3 /*break*/, 6];
                file = files_1[_i];
                filePath = path_1["default"].join(OUTPUT_DIR, file);
                return [4 /*yield*/, fs_extra_1["default"].stat(filePath)];
            case 3:
                stats = _a.sent();
                if (!(now - stats.mtimeMs > AUTO_DELETE_AFTER * 1000)) return [3 /*break*/, 5];
                return [4 /*yield*/, fs_extra_1["default"].unlink(filePath)];
            case 4:
                _a.sent();
                console.log("\uD83D\uDDD1 Deleted old file: ".concat(filePath));
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 2];
            case 6: return [2 /*return*/];
        }
    });
}); });
function parseImageParams(req, fileParams) {
    var defaultParams = { format: "webp", quality: 70, width: 120, height: 120, aspect: "stretch" };
    var paramMatches = __assign({}, defaultParams);
    if (fileParams) {
        var regex = /([fqhwa])_([^-]+)/g;
        var match = void 0;
        while ((match = regex.exec(fileParams)) !== null) {
            var key = match[1];
            var value = match[2];
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
        var query = req.query;
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
function getEnvBoolean(key, defaultValue) {
    var _a, _b;
    if (defaultValue === void 0) { defaultValue = true; }
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
var PORT = 8080;
fastify.listen({ port: PORT }, function (err, address) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log("\uD83D\uDE80 Fastify server running at ".concat(address));
});
