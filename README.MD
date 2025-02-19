# Node.js Image Server with Fastify & Nginx
This image processing server is built using Fastify and integrates with Nginx to handle:

* Serving static images
* Processing images dynamically (resize, convert, compress)
* Handling both Local Files & Remote URLs
* Caching processed images
* Decoding Base64 paths for secure file access

## Nginx Handles Static & Processed Images
If an image exists, it is served directly.
If an image is requested in Base64 format, Nginx forwards it to Fastify for decoding.

# Fastify Processes Images & Caches Them
* Accepts image processing parameters (format, quality, width, height).
* Resizes, compresses, and converts images using sharp.
* Stores processed images in /compressed_images/ for faster retrieval.
* URLs can contain Base64-encoded paths (to prevent direct file access).
* Fastify decodes Base64 paths and securely serves images.

# Features
 - Fastify Server: Handles image requests dynamically
 - Sharp Image Processing: Resizes, compresses, and converts images
 - Handles URLs & Local Files: Works with remote & local images
 - Nginx for Static Files: Improves performance & caching
 - Base64 Secure Paths: Protects direct file access
 - Cron Auto-Cleanup: Deletes old images automatically
 - Jest Tests: Ensures reliability with automated tests

# Install 

```
sudo apt install npm
#npm init -y
npm install

```

If you are running the TypeScript version:

```
npm run dev
```
Or, to build and run the compiled JavaScript version for production :
```
npm run build
npm start
```

npx tsc > Compile TS to JS
node dist/server.js	> Run compiled JS server
npm run dev	> Run TS directly (no build)
npm run build > Compile TS (tsc)
npm start >	Run compiled JS (node dist/server.js)
npx tsc --watch	> Auto-compile on file changes

# Check server 
sudo apt install net-tools
netstat -tulnp | grep :8080
curl -I http://127.0.0.1:8080
curl -i http://127.0.0.1:8080

# Nginx Node JS server integration

```
#node js image resizing snippet
set $COMPRESSED_IMAGES /nodejs-image-server/compressed_images/;

location /media/2/ {
        rewrite ^/media/2/(.*)$ /$1 break;
        set $image_path "$MAGE_ROOT$COMPRESSED_IMAGES$1";
        try_files $image_path @nodejs;
}

location @nodejs {
        proxy_pass http://127.0.0.1:8080$request_uri;
        proxy_set_header Host $host;
        proxy_set_header X-Original-URI $request_uri;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
}
#node js snippet end
```

## Magento config 
private const XML_PATH_CATALOG_MEDIA_URL_FORMAT = 'web/url/catalog_media_url_format';
public const IMAGE_OPTIMIZATION_PARAMETERS = 'image_optimization_parameters';
public const HASH = 'hash';
```
php bin/magento config:set web/url/catalog_media_url_format image_optimization_parameters #hash
```
## Or replace default magento media static
insert this into <br>

**location /media/ {**

```
set $COMPRESSED_IMAGES /nodejs-image-server/compressed_images/;

location ~* ^/media/catalog/.* {
        rewrite ^/media/(.*)$ /$1 break;
        set $image_path "$MAGE_ROOT$COMPRESSED_IMAGES$1";
        
        #Path Sample: nodejs-image-server/compressed_images/catalog/product/u/g/ug07-bk-0-f_webp-q_99-w_500-h_500-a_stretch.jpg
        # If the file exists, set a custom header before serving
        add_header X-Debug-Full-Path "$image_path" always;

        if (-f $image_path) {
            add_header X-Served-By "Nginx-Static-Cache" always;
        }
        try_files $image_path @nodejs;
}
````

But the same @nodejs

## Running as a proces
```
sudo npm install -g pm2
pm2 start server.js --name myserver
pm2 save
pm2 startup
## Remove from startup
# pm2 unstartup 
## stop process
# pm2 stop myserver
```

#NVM 
```
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
source ~/.bashrc   # For Bash
source ~/.zshrc    # For Zsh
source ~/.profile  # Alternative (if the above don't work)

nvm install node
nvm use v23
```