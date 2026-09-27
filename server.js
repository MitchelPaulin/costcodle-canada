const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 8000;
const rootDirectory = __dirname;
const apiUrl = "https://www.cocopricetracker.ca//api/proxy-weekly-sales/2026-09-21?location=east_wh&category=Grocery&page=1&limit=100";

const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === "/api/items") {
    try {
      const upstreamResponse = await fetch(apiUrl);
      response.writeHead(upstreamResponse.status, {
        "Content-Type": "application/json",
      });
      response.end(await upstreamResponse.text());
    } catch (error) {
      response.writeHead(502, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "Unable to load live item data" }));
    }
    return;
  }

  const requestedPath = requestUrl.pathname === "/"
    ? "/index.html"
    : requestUrl.pathname;
  const filePath = path.resolve(rootDirectory, `.${requestedPath}`);

  if (!filePath.startsWith(`${rootDirectory}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500);
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    const contentType = contentTypes[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(file);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`COSTCODLE running at http://localhost:${port}`);
});
