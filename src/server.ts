//import express, { Request, Response, NextFunction } from "express";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import fastifyStatic from "@fastify/static";
import fs from "fs-extra";
import path from "path";
import cron from "node-cron";
import dotenv from "dotenv";
import { processImage } from "./imageProcessor";

dotenv.config();

console.log("Server DIR: " + __dirname);

var fileExistsCache: any = [];

const ENCRYPT = process.env.ENCRYPT ?? "";
const MEDIA_URL = process.env.MEDIA_URL ?? "/media/2/*";
const FULL_BASE64_URI = process.env.FULL_BASE64_URI ?? false;
var MAGENTO_URI = getEnvBoolean('MAGENTO_URI', true);

// const app = express();
const fastify = Fastify({ logger: true });

// Example Route
fastify.get("/", async (request, reply) => {
    return { message: "Fastify Image Server!" };
});

const SOURCE_DIR = path.join(__dirname, "../../pub/media");
const OUTPUT_DIR = path.join(__dirname, "../compressed_images");

// Register `fastify-static`
fastify.register(fastifyStatic, {
    root: OUTPUT_DIR,  // Serve static files from the output directory
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
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to validate image format
const isValidFormat = (format: string): boolean => ["jpg", "webp"].includes(format.toLowerCase());

// Function to check if a string is a valid URL
const isValidUrl = (str: string): boolean => {
    try {
        new URL(str);
        return true;
    } catch (e) {
        return false;
    }
};

const downloadImage = async (url: string, dest: string): Promise<string> => {
    console.log(`📥 Downloading image from: ${url}`);

    const response = await fetch(url); // Native fetch (No need for node-fetch)

    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Convert arrayBuffer() to Buffer
    const buffer = Buffer.from(await response.arrayBuffer());

    await fs.writeFile(dest, buffer);
    console.log(`✅ Image downloaded and saved to: ${dest}`);

    return dest;
};

// Function to generate processed file path
/*const getProcessedFilePath = (
    filename: string,
    format: string,
    quality: number,
    width: number | null,
    height: number | null,
    aspect: string
): string => {
    return path.join(
        OUTPUT_DIR,
        `${path.basename(filename, path.extname(filename))}-${format}-${quality}-${width || "auto"}x${height || "auto"}-${aspect}.${format}`
    );
};*/

/*
// 404 "No Route" Middleware - Handles unmatched routes
app.use((req: Request, res: Response, next: NextFunction) => {
   console.log("Not Found");
    res.status(404).json({
        error: "Not Found",
        message: `The requested URL '${req.originalUrl}' was not found on this server.`,
    });
});

// Global Error Handler - Catches unexpected errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Server Error:", err);
    res.status(500).json({
        error: "Internal Server Error",
        message: "Something went wrong!",
    });
});
*/

// Define Type for Request Parameters & Query
interface GetFileParams {
    "*": string; // Wildcard parameter for dynamic paths
}

interface GetFileQuery {
    format?: string;
    quality?: string;
    width?: string;
    height?: string;
    aspect?: string;
}

// Fastify Main Media Route
fastify.get(MEDIA_URL, async (
    req: FastifyRequest<{ Params: GetFileParams; Querystring: GetFileQuery }>,
    res: FastifyReply
) => {
    console.time("Request Processing");
    console.log("GET file router");

    // /media/2/Y/Y2F0YWxvZy9wcm9kdWN0L3cvYi93YjA0LWJsdWUtMC5qcGc-f_webp-q_60-w_805-h_806-a_keep
    // /path/fitst letter as a folder/ BAse 64 of the magento original or other image url-f_format-q_quality-w_width-h_height-a_aspect
    let filePathOrUrl: string | undefined = req.params["*"];
    let fileParams: string | undefined;
    let fileBase64: string | null;
    let originalPath: string | undefined;
    let magentoImagePath: string | undefined;

    if (MAGENTO_URI) {
        magentoImagePath = filePathOrUrl;
        filePathOrUrl = filePathOrUrl;
        originalPath = filePathOrUrl;
    } else if (filePathOrUrl) {
        let splitPath: Array<string> = filePathOrUrl.split("/");
        let tempPath: string;
        if (splitPath[0].length === 1) {
            tempPath = splitPath[1];
        } else {
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
    } else {
        filePathOrUrl = req.query.format;
    }

    // Determine if it's a URL or Local File
    const isUrl = filePathOrUrl?.startsWith("http");
    const isLocalFile = !isUrl && filePathOrUrl;

    if (!filePathOrUrl || !originalPath) {
        res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
        return res.status(400).send({ error: "Invalid or missing file path." });
    }

    // Extract & Parse Image Transformation Parameters
    var { format, quality, width, height, aspect } = parseImageParams(req, fileParams);
    format = req.query['format'] ?? format;
    quality = parseInt(req.query['quality'] as string ?? quality);
    width = parseInt(req.query['width'] as string ?? width);
    height = parseInt(req.query['height'] as string ?? height);
    aspect = req.query['aspect'] ?? aspect;

    console.log(`📥 Processing Image: ${filePathOrUrl} | Format: ${format}, Quality: ${quality}, Width: ${width}, Height: ${height}, Aspect: ${aspect}`);

    const filename = isUrl ? path.basename(new URL(filePathOrUrl).pathname) : path.basename(filePathOrUrl);
    const originalFilePath = isLocalFile ? path.resolve(SOURCE_DIR, filePathOrUrl) : path.join(SOURCE_DIR, filename);
    let processedFilePath = "";
    if (MAGENTO_URI === true) {
        let fileName = originalPath.split('/').pop() ?? "";
        let imageDir = originalPath.replace(fileName, "");
        let dir = OUTPUT_DIR + '/' + imageDir;
        // Ensure output directory exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        let paramPath = '-f_' + format + '-q_' + quality + '-w_' + width + '-h_' + height + '-a_' + aspect;
        processedFilePath = dir + fileName.replace('.jpg', '') + paramPath + '.jpg';
    } else {
        let dir = OUTPUT_DIR + '/' + originalPath[0];
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        processedFilePath = dir + '/' + originalPath + '.jpg';
    }

    console.timeEnd("Request Processing");
    // Check if Processed File Exists (Cache)
    if (fileExistsCache[processedFilePath] || await fs.exists(processedFilePath)) {
        if (!fileExistsCache[processedFilePath]) {
            fileExistsCache[processedFilePath] = true;
        }
       
        let processedImageBuffer: Buffer;
        try {
            processedImageBuffer = await fs.readFile(processedFilePath);
            console.log(`✅ Returning cached image: ${processedFilePath}`);
        } catch (error) {
            // Sometimse some issues with the cache 
            if (await fs.exists(processedFilePath)) {
                fileExistsCache[processedFilePath] = true;
                processedImageBuffer = await fs.readFile(processedFilePath);
            } else {
                throw new Error(`File not found: ${processedFilePath}`);
            } 
        }
        return res.type(`image/${format}`).send(processedImageBuffer);
    }

    // Handle Local File Processing
    if (isLocalFile) {
        if (!await fs.exists(originalFilePath)) {
            res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            res.header("Pragma", "no-cache");
            res.header("Expires", "0");

            return res.status(404).send({ error: "Local file not found." });
        }
    } else {
        // ✅ Download Image If Not Available Locally
        if (!await fs.exists(originalFilePath)) {
            try {
                await downloadImage(filePathOrUrl, originalFilePath);
            } catch (error) {
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
        const processedImageFile = await processImage(originalFilePath, processedFilePath, format, quality, width, height, aspect);
        const processedImageBuffer = await fs.readFile(processedImageFile);
        // await fs.writeFile(processedFilePath, processedImageBuffer);
        // return res.sendFile(processedImageFile);
        console.timeEnd("Proces Image File");
        return res.type(`image/${format}`).send(processedImageBuffer);
    } catch (error) {
        res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.header("Pragma", "no-cache");
        res.header("Expires", "0");
        console.error("❌ Image Processing Error:", error);
        res.status(500).send({ error: "Failed to process image." });
    }
});


// **Scheduled Job: Auto-delete Old Images**
cron.schedule("* 2 */10 * *", async () => {
    console.log("🗑 Running cleanup task...");

    const files = await fs.readdir(OUTPUT_DIR);
    const now = Date.now();

    for (const file of files) {
        const filePath = path.join(OUTPUT_DIR, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > AUTO_DELETE_AFTER * 1000) {
            await fs.unlink(filePath);
            console.log(`🗑 Deleted old file: ${filePath}`);
        }
    }
});

function parseImageParams(req: FastifyRequest<{ Querystring: GetFileQuery }>, fileParams?: string) {
    const defaultParams = { format: "webp", quality: 70, width: 120, height: 120, aspect: "stretch" };
    const paramMatches: { [key: string]: string | number | null } = { ...defaultParams };

    if (fileParams) {
        const regex = /([fqhwa])_([^-]+)/g;
        let match;
        while ((match = regex.exec(fileParams)) !== null) {
            const key = match[1];
            const value = match[2];

            switch (key) {
                case "f": paramMatches.format = value; break;
                case "q": paramMatches.quality = parseInt(value, 10) || 80; break;
                case "w": paramMatches.width = parseInt(value, 10) || defaultParams.width; break;
                case "h": paramMatches.height = parseInt(value, 10) || defaultParams.height; break;
                case "a": paramMatches.aspect = value; break;
            }
        }
    } else {
        // Fix: Explicitly cast `req.query` as `GetFileQuery`
        const query = req.query as GetFileQuery;

        paramMatches.format = query.format || defaultParams.format;
        paramMatches.quality = query.quality ? parseInt(query.quality, 10) || 80 : 80;
        paramMatches.width = query.width ? parseInt(query.width, 10) : defaultParams.width;
        paramMatches.height = query.height ? parseInt(query.height, 10) : defaultParams.height;
        paramMatches.aspect = query.aspect || "stretch";
    }
    return paramMatches as { format: string; quality: number; width: number | null; height: number | null; aspect: string };
}

/**
 * Decodes a Base64 string back to a file path.
 * @param {string} base64String - The Base64 encoded path.
 * @returns {string} - The decoded file path.
 */
function decodeBase64ToPath(base64String: string) {
    return Buffer.from(base64String, "base64").toString("utf-8");
}

function getEnvBoolean(key: string, defaultValue: boolean = true): boolean {
    return process.env[key]?.toLowerCase() === "true"
        ? true
        : process.env[key]?.toLowerCase() === "false"
            ? false
            : defaultValue;
};

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

